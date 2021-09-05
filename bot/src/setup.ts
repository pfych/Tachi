import { LoggerLayers } from "config";
import { createLayeredLogger } from "utils/logger";
import { FormatPrError } from "utils/prudence";
import JSON5 from "json5";
import fs from "fs";
import Prudence from "prudence";
import { config } from "dotenv";

// Initialise .env.
config();

// Reads the bots config file from $pwd/conf.json5.
// Validates it using prudence.

const logger = createLayeredLogger(LoggerLayers.botConfigSetup);

export interface BotConfig {
	/**
	 * Determines what port to host the express server on.
	 */
	SERVER_PORT: number;
	/**
	 * Determines where our relevant tachi-server instance is.
	 */
	TACHI_SERVER_LOCATION: string;
	/**
	 * Determines where we're hosted.
	 */
	OUR_URL: string;
}

function ParseBotConfig(fileLoc = "conf.json5"): BotConfig {
	let data;

	try {
		const contents = fs.readFileSync(fileLoc, "utf-8");
		data = JSON5.parse(contents);
	} catch (err) {
		logger.crit("Failed to find a valid conf.json5 file. Cannot boot.", { err });

		throw err;
	}

	const err = Prudence(data, {
		SERVER_PORT: Prudence.isPositiveNonZeroInteger,
		TACHI_SERVER_LOCATION: "string",
		OUR_URL: "string",
	});

	if (err) {
		logger.crit(FormatPrError(err, "Invalid conf.json5 file. Cannot safely boot."));

		throw err;
	}

	return data;
}

export interface ProcessEnvironment {
	/**
	 * What environment we're running in. This is typically "PROD" or "DEV"
	 */
	ENV: string;
	/**
	 * Our discord authentication token.
	 */
	DISCORD_TOKEN: string;
	/**
	 * Our tachi OAuth2 client's secret token.
	 */
	BOT_CLIENT_SECRET: string;
	/**
	 * Our tachi OAuth2 client's ID.
	 */
	BOT_CLIENT_ID: string;
}

function ParseEnvVars() {
	const err = Prudence(process.env, {
		ENV: "string",
		DISCORD_TOKEN: "string",
		BOT_CLIENT_SECRET: "string",
		BOT_CLIENT_ID: "string"
	}, {}, { allowExcessKeys: true });

	if (err) {
		logger.crit(FormatPrError(err, "Invalid environment. Cannot safely boot."));

		throw err;
	}

	return process.env as unknown as ProcessEnvironment;
}

export const BotConfig: BotConfig = ParseBotConfig(process.env.CONF_JSON5_LOCATION);


export const ProcessEnv = ParseEnvVars();
