CREATE TYPE "CharacterClass" AS ENUM ('PHYSICAL_DPS', 'MAGIC_DPS', 'TANK');
CREATE TABLE "Account" ("id" UUID PRIMARY KEY);
CREATE TABLE "Character" (
  "id" UUID PRIMARY KEY, "accountId" UUID NOT NULL UNIQUE REFERENCES "Account"("id"),
  "class" "CharacterClass" NOT NULL, "realm" INTEGER NOT NULL CHECK ("realm" BETWEEN 1 AND 11),
  "star" INTEGER NOT NULL CHECK ("star" BETWEEN 1 AND 9),
  "hp" BIGINT NOT NULL CHECK ("hp" BETWEEN 0 AND 9007199254740991),
  "ki" BIGINT NOT NULL CHECK ("ki" BETWEEN 0 AND 9007199254740991),
  "gold" BIGINT NOT NULL CHECK ("gold" >= 0),
  "mapId" TEXT NOT NULL CHECK (length("mapId") > 0),
  "areaId" TEXT NOT NULL CHECK (length("areaId") > 0),
  "respawnId" TEXT NOT NULL CHECK (length("respawnId") > 0), "pkEnabled" BOOLEAN NOT NULL
);
CREATE FUNCTION prevent_class_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."class" IS DISTINCT FROM OLD."class" THEN RAISE EXCEPTION 'Character class is immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER character_class_immutable BEFORE UPDATE ON "Character" FOR EACH ROW EXECUTE FUNCTION prevent_class_change();
