import * as Joi from 'joi';

// file for configuration .env

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test').default('development'),
  PORT: Joi.number().default(8080).required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
});
