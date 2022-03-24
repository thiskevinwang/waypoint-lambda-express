DROP SCHEMA IF EXISTS pokemon CASCADE;
CREATE SCHEMA pokemon;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pokemon_type') THEN
        CREATE TYPE pokemon_type as ENUM(
        'Bug','Dark','Dragon','Electric',
        'Fairy','Fighting','Fire','Flying',
        'Ghost','Grass','Ground','Ice',
        'Normal','Poison','Psychic','Rock','Steel','Water'
        );
		RAISE NOTICE 'enum "pokemon_type" was created';
    ELSE
    	RAISE WARNING 'enum "pokemon_type" already exists';
    END IF;
END
$$;


-- Both input_* tables are /raw/ input tables. These are formatted
-- so we can do a raw, unprocessed copy directly from the input files.
CREATE TABLE pokemon.pokemon (
	id INT NOT NULL,
	name TEXT NOT NULL,
	type_1 pokemon_type NOT NULL,
	type_2 pokemon_type,
	total INT NOT NULL,
	hp INT NOT NULL,
	attack INT NOT NULL,
	defense INT NOT NULL,
	sp_atk INT NOT NULL,
	sp_def INT NOT NULL,
	speed INT NOT NULL,
	generation INT NOT NULL,
	legendary BOOLEAN NOT NULL
);