import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1775161718970 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create players table
        await queryRunner.query(`
            CREATE TABLE "players" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying NOT NULL UNIQUE,
                "pinHash" character varying NOT NULL,
                "isAdmin" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_players_id" PRIMARY KEY ("id")
            )
        `);

        // Create grapes table
        await queryRunner.query(`
            CREATE TABLE "grapes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL UNIQUE,
                "color" character varying NOT NULL,
                "synonyms" text,
                "regions" text NOT NULL,
                "aromas" text NOT NULL,
                CONSTRAINT "PK_grapes_id" PRIMARY KEY ("id")
            )
        `);

        // Create games table
        await queryRunner.query(`
            CREATE TABLE "games" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying(6) NOT NULL UNIQUE,
                "status" character varying NOT NULL DEFAULT 'WAITING',
                "hostId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "finishedAt" TIMESTAMP,
                CONSTRAINT "PK_games_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_games_hostId" FOREIGN KEY ("hostId") REFERENCES "players"("id") ON DELETE CASCADE
            )
        `);

        // Create game_players table (join table)
        await queryRunner.query(`
            CREATE TABLE "game_players" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gameId" uuid NOT NULL,
                "playerId" uuid NOT NULL,
                CONSTRAINT "PK_game_players_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_game_players_gameId" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_game_players_playerId" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_game_players" UNIQUE ("gameId", "playerId")
            )
        `);
        
        // Create indexes  for game_players
        await queryRunner.query(`CREATE INDEX "IDX_game_players_gameId" ON "game_players" ("gameId")`);
        await queryRunner.query(`CREATE INDEX "IDX_game_players_playerId" ON "game_players" ("playerId")`);

        // Create rounds table
        await queryRunner.query(`
            CREATE TABLE "rounds" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gameId" uuid NOT NULL,
                "roundNumber" integer NOT NULL,
                "currentPhase" integer NOT NULL DEFAULT 1,
                "grapeId" uuid NOT NULL,
                "grapeName" character varying NOT NULL,
                "vintage" integer NOT NULL,
                "glassPosition" integer NOT NULL,
                "regionTrue" character varying NOT NULL,
                "regionFalse1" character varying NOT NULL,
                "regionFalse2" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "finishedAt" TIMESTAMP,
                CONSTRAINT "PK_rounds_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_rounds_gameId" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_rounds_grapeId" FOREIGN KEY ("grapeId") REFERENCES "grapes"("id") ON DELETE SET NULL
            )
        `);

        // Create answers table
        await queryRunner.query(`
            CREATE TABLE "answers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "roundId" uuid NOT NULL,
                "playerId" uuid NOT NULL,
                "colorAnswerId" uuid,
                "grapeAnswerId" uuid,
                "yearAnswer" integer,
                "regionAnswer" character varying,
                "bottlePosition" integer,
                "score" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_answers_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_answers_roundId" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_answers_playerId" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_answers_colorAnswerId" FOREIGN KEY ("colorAnswerId") REFERENCES "grapes"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_answers_grapeAnswerId" FOREIGN KEY ("grapeAnswerId") REFERENCES "grapes"("id") ON DELETE SET NULL
            )
        `);

        // Create bottles table
        await queryRunner.query(`
            CREATE TABLE "bottles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "roundId" uuid NOT NULL,
                "position" integer NOT NULL,
                "vintage" integer,
                "colorTrueAnswer" character varying,
                "colorFalseAnswer1" character varying,
                "colorFalseAnswer2" character varying,
                CONSTRAINT "PK_bottles_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_bottles_roundId" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "bottles"`);
        await queryRunner.query(`DROP TABLE "answers"`);
        await queryRunner.query(`DROP INDEX "IDX_game_players_playerId"`);
        await queryRunner.query(`DROP INDEX "IDX_game_players_gameId"`);
        await queryRunner.query(`DROP TABLE "game_players"`);
        await queryRunner.query(`DROP TABLE "rounds"`);
        await queryRunner.query(`DROP TABLE "games"`);
        await queryRunner.query(`DROP TABLE "grapes"`);
        await queryRunner.query(`DROP TABLE "players"`);
    }
}

