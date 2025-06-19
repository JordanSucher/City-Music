-- CreateTable
CREATE TABLE "Show" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "omr_id" INTEGER,
    "ticket_url" TEXT,
    "venue_name" TEXT,
    "date" DATETIME
);

-- CreateTable
CREATE TABLE "Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "spotify_uri" TEXT,
    "bandId" INTEGER,
    CONSTRAINT "Track_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Band" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "spotify_id" TEXT
);

-- CreateTable
CREATE TABLE "BandShow" (
    "bandId" INTEGER NOT NULL,
    "showId" INTEGER NOT NULL,

    PRIMARY KEY ("bandId", "showId"),
    CONSTRAINT "BandShow_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BandShow_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Show_omr_id_key" ON "Show"("omr_id");

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotify_uri_key" ON "Track"("spotify_uri");

-- CreateIndex
CREATE UNIQUE INDEX "Band_name_key" ON "Band"("name");
