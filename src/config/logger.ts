import bunyan from 'bunyan';

const level = (process.env.LOG_LEVEL as bunyan.LogLevel) || 'info';
const isTest = process.env.NODE_ENV === 'test';

const logger = bunyan.createLogger({
  name: 'credence-transaction-service',
  level,
  serializers: bunyan.stdSerializers,
  streams: isTest
    ? [{ level: 'fatal' as bunyan.LogLevel, type: 'raw', stream: process.stderr }]
    : [{ level, stream: process.stdout }],
});

export default logger;
