-- CreateTable
CREATE TABLE "ShortenedUrlStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hits" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ShortenedUrlStats_id_fkey" FOREIGN KEY ("id") REFERENCES "ShortenedUrl" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
