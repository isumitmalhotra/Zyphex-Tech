/**
 * Workflow Services Index
 * 
 * Exports all external service integrations for workflow actions.
 */

export * from './email-service';
export * from './slack-service';
export * from './teams-service';
export * from './sms-service';

import emailService from './email-service';
import slackService from './slack-service';
import teamsService from './teams-service';
import smsService from './sms-service';

export const services = {
  email: emailService,
  slack: slackService,
  teams: teamsService,
  sms: smsService,
};

export default services;
