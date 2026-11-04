#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_voicepack.py —— 为课堂闪卡生成内嵌中文语音包

用法：
    python3 make_voicepack.py 词表.txt
    python3 make_voicepack.py 词表.txt -o voice_pack.js

输入：一个纯文本文件，每行一个中文词/短语/句子（空行忽略）。
输出：voice_pack.js，内容形如：
    window.VOICE_PACK = {
        "面包": "data:audio/mpeg;base64,...",
        ...
    };
把这个文件和生成的闪卡 HTML 放在一起，或把内容内嵌进 HTML 即可。

只使用 Python 3 标准库，无需 pip install。语音来自百度翻译 TTS，
大陆可直连、无需 VPN。
"""
import argparse
import base64
import concurrent.futures
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TTS_URL = "https://fanyi.baidu.com/gettts?lan=zh&text={text}&spd=5&source=web"
HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 20
MAX_WORKERS = 3
RETRIES = 4
BACKOFF = [1.5, 4.0, 8.0, 15.0]


def fetch_one(zh):
    """抓一条语音。遇到 5xx / 超时自动重试，指数退避。"""
    q = urllib.parse.quote(zh)
    url = TTS_URL.format(text=q)
    last = None
    for attempt in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            data = urllib.request.urlopen(req, timeout=TIMEOUT).read()
            if not data or len(data) < 100:
                raise RuntimeError("返回内容异常，可能是文本过长或被限流")
            return zh, "data:audio/mpeg;base64," + base64.b64encode(data).decode()
        except urllib.error.HTTPError as e:
            last = e
            # 4xx 里只有 429 值得重试
            if e.code < 500 and e.code != 429:
                raise
        except Exception as e:
            last = e
        if attempt < RETRIES - 1:
            # 退避 + 抖动，避免所有线程同时重试又撞在一起
            time.sleep(BACKOFF[attempt] + random.uniform(0, 0.8))
    raise last if last else RuntimeError("未知错误")


def load_existing(path):
    """读取已存在的 voice_pack.js，返回其中的 {中文: base64}。用于只补抓缺失条目。"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()
    except FileNotFoundError:
        return {}
    m = re.search(r"=\s*(\{[\s\S]*\})\s*;?\s*$", raw)
    if not m:
        return {}
    try:
        data = json.loads(m.group(1))
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def default_output(input_path):
    """按输入文件名推导输出名：
       lesson07_words.txt     -> voice_pack_lesson07_words.js
       lesson07_sentences.txt -> voice_pack_lesson07_sentences.js
       其它                    -> voice_pack.js
    """
    base = os.path.splitext(os.path.basename(input_path))[0]
    m = re.search(r"lesson(\d{1,2})_(words|sentences)$", base, re.I)
    if m:
        tag = "lesson" + m.group(1).zfill(2) + "_" + m.group(2).lower()
        return "voice_pack_" + tag + ".js"
    return "voice_pack.js"


def read_items(path):
    """读词表。自动识别编码：UTF-8 / 带 BOM 的 UTF-16 / GB18030。
    遇到 Word 二进制文档时给出明确提示，而不是抛出编码错误。"""
    with open(path, "rb") as f:
        raw = f.read()

    if raw.startswith(b"PK\x03\x04"):
        raise SystemExit(
            f"「{path}」是 Word 文档（.docx），不是纯文本。\n"
            "请在 Word 里用「另存为」→ 格式选「纯文本 (.txt)」重新保存。"
        )
    if raw.startswith(b"\xd0\xcf\x11\xe0"):
        raise SystemExit(
            f"「{path}」是旧版 Word 文档（.doc），不是纯文本。\n"
            "请在 Word 里用「另存为」→ 格式选「纯文本 (.txt)」重新保存。"
        )
    if raw.startswith(b"{\\rtf"):
        raise SystemExit(
            f"「{path}」是富文本（RTF）。\n"
            "请用「文本编辑」打开，按 Shift+Command+T 转为纯文本后重新保存。"
        )

    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        text = raw.decode("utf-16")
    else:
        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = raw.decode("gb18030")

    return [line.strip() for line in text.splitlines() if line.strip()]


def main():
    ap = argparse.ArgumentParser(description="生成课堂闪卡中文语音包")
    ap.add_argument("input", help="词表文件，每行一个中文词/句")
    ap.add_argument("-o", "--output", default=None,
                    help="输出 JS 文件（默认按输入名推导，如 voice_pack_lesson07_words.js）")
    ap.add_argument("-w", "--workers", type=int, default=MAX_WORKERS, help="并发数（默认 3）")
    ap.add_argument("--fresh", action="store_true", help="忽略已有 voice_pack.js，全部重新抓取")
    args = ap.parse_args()

    if not args.output:
        args.output = default_output(args.input)

    items = read_items(args.input)
    if not items:
        print("词表为空", file=sys.stderr)
        sys.exit(1)

    pack = {} if args.fresh else load_existing(args.output)
    skipped = [zh for zh in items if zh in pack]
    todo = [zh for zh in items if zh not in pack]

    if skipped:
        print(f"已有 {len(skipped)} 条语音，跳过不重复抓取。")
    if not todo:
        print(f"词表里 {len(items)} 条全部已存在，无需抓取。")
        print(f"输出：{args.output}（未改动）")
        return

    print(f"需要抓取 {len(todo)} 条，开始（{args.workers} 路并发，失败自动重试 {RETRIES} 次）...")
    failed = []
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(fetch_one, zh): zh for zh in todo}
        for fut in concurrent.futures.as_completed(futures):
            zh = futures[fut]
            done += 1
            try:
                k, v = fut.result()
                pack[k] = v
                print(f"  [{done}/{len(todo)}] OK  {zh}  ({len(v)} chars)")
            except Exception as e:
                failed.append((zh, str(e)))
                print(f"  [{done}/{len(todo)}] FAIL  {zh}  {e}")

    with open(args.output, "w", encoding="utf-8") as f:
        f.write("window.VOICE_PACK = ")
        json.dump(pack, f, ensure_ascii=False)
        f.write(";\n")

    kb = sum(len(v) for v in pack.values()) / 1024
    print(f"\n完成：本次成功 {len(todo) - len(failed)} 条，失败 {len(failed)} 条；文件共 {len(pack)} 条")
    print(f"输出：{args.output}（base64 约 {kb:.0f} KB）")
    if failed:
        print("失败条目（再运行一次本脚本即可只补抓这些）：")
        for zh, err in failed:
            print(f"  {zh}  ->  {err}")
        sys.exit(2)


if __name__ == "__main__":
    main()
