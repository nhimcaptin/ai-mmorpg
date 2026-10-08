-- Additive only: no legacy data backfill, database reset or destructive contraction.
CREATE TABLE "CharacterInitialization" (
  "characterId" UUID PRIMARY KEY REFERENCES "Character"("id"),
  "maxHp" BIGINT NOT NULL CHECK ("maxHp" BETWEEN 0 AND 9007199254740991),
  "maxKi" BIGINT NOT NULL CHECK ("maxKi" BETWEEN 0 AND 9007199254740991),
  "cultivationExp" BIGINT NOT NULL CHECK ("cultivationExp" >= 0),
  "x" DOUBLE PRECISION NOT NULL CHECK ("x" >= 0 AND "x" < 'Infinity'::double precision),
  "y" DOUBLE PRECISION NOT NULL CHECK ("y" >= 0 AND "y" < 'Infinity'::double precision)
);
