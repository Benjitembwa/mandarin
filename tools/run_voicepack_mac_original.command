#!/bin/zsh
# Mac 启动器：双击即可生成语音包（用 caffeinate 防止生成期间系统休眠）
# 会自动找同目录下所有 lessonNN_words.txt / lessonNN_sentences.txt，
# 输出对应的 voice_pack_lessonNN_words.js / voice_pack_lessonNN_sentences.js。
# 如果没有任何 lesson*.txt，则退回处理 words.txt。
cd "$(dirname "$0")"

files=(lesson[0-9][0-9]_words.txt lesson[0-9][0-9]_sentences.txt(N))

if (( ${#files[@]} == 0 )); then
  if [[ -f words.txt ]]; then
    files=(words.txt)
  else
    echo "没找到词表文件。"
    echo
    echo "请把生成器导出的 lesson07_words.txt（或 lesson07_sentences.txt）"
    echo "放在这个文件夹里，再双击本文件。"
    echo
    echo "按回车键关闭窗口..."
    read
    exit 1
  fi
fi

echo "找到 ${#files[@]} 个词表：${files}"
echo

for f in $files; do
  echo "================ $f ================"
  caffeinate -i python3 make_voicepack.py "$f"
  echo
done

echo "全部完成。按回车键关闭窗口..."
read
