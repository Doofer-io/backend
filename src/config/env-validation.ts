import * as Joi from 'joi';

// file for configuration .env

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test').default('development'),
  PORT: Joi.number().default(8080).required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  // env for google
  JWT_EXPIRES_IN_TEMP: Joi.string().valid('15m'),
  CLIENT_ID: Joi.string(),
  CLIENT_SECRET: Joi.string(),
  API_URL: Joi.string(),
  FRONT_URL: Joi.string(),
});
