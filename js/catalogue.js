/* Ce manifeste sert de secours quand le site est ouvert via file://.
   Sur http://localhost, app.js détecte automatiquement les fichiers dans cards/ et texts/.
   Si vous ajoutez des leçons et ouvrez index.html directement, ajoutez-les aussi ici. */
window.FLASHCARDS_CATALOGUE = {
  totalLessons: 30,
  exclude: {1: []},
  available: {
    1: ["words", "sentences", "text"],
    2: ["words", "text"]
  }
};
