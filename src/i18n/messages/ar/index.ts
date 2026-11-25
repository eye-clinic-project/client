/**
 * All translation namespaces for "ar", loaded by i18n/request.ts.
 * Arabic must have the same namespaces and keys as i18n/messages/en.
 * To add a namespace: create <name>.json here and in the other language, then register it below.
 */

import type en from "../en"
import admin from "./admin.json"
import analyses from "./analyses.json"
import appointments from "./appointments.json"
import auth from "./auth.json"
import chat from "./chat.json"
import common from "./common.json"
import dashboard from "./dashboard.json"
import meta from "./meta.json"
import notifications from "./notifications.json"
import patient from "./patient.json"
import patients from "./patients.json"
import reports from "./reports.json"
import settings from "./settings.json"
import shell from "./shell.json"
import validation from "./validation.json"
import verification from "./verification.json"

const messages: typeof en = {
  admin: admin,
  analyses: analyses,
  appointments: appointments,
  auth: auth,
  chat: chat,
  common: common,
  dashboard: dashboard,
  meta: meta,
  notifications: notifications,
  patient: patient,
  patients: patients,
  reports: reports,
  settings: settings,
  shell: shell,
  validation: validation,
  verification: verification,
}

export default messages
