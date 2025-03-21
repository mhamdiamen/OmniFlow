/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as files from "../files.js";
import type * as functions_setup from "../functions/setup.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as mutations_company from "../mutations/company.js";
import type * as mutations_companyModules from "../mutations/companyModules.js";
import type * as mutations_invitiations from "../mutations/invitiations.js";
import type * as mutations_modules from "../mutations/modules.js";
import type * as mutations_permissions from "../mutations/permissions.js";
import type * as mutations_projects from "../mutations/projects.js";
import type * as mutations_recentActivity from "../mutations/recentActivity.js";
import type * as mutations_roles from "../mutations/roles.js";
import type * as mutations_teams from "../mutations/teams.js";
import type * as mutations_users from "../mutations/users.js";
import type * as queries_company from "../queries/company.js";
import type * as queries_invitations from "../queries/invitations.js";
import type * as queries_modules from "../queries/modules.js";
import type * as queries_permissions from "../queries/permissions.js";
import type * as queries_projects from "../queries/projects.js";
import type * as queries_recentActivity from "../queries/recentActivity.js";
import type * as queries_roles from "../queries/roles.js";
import type * as queries_teams from "../queries/teams.js";
import type * as queries_users from "../queries/users.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  files: typeof files;
  "functions/setup": typeof functions_setup;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  "mutations/company": typeof mutations_company;
  "mutations/companyModules": typeof mutations_companyModules;
  "mutations/invitiations": typeof mutations_invitiations;
  "mutations/modules": typeof mutations_modules;
  "mutations/permissions": typeof mutations_permissions;
  "mutations/projects": typeof mutations_projects;
  "mutations/recentActivity": typeof mutations_recentActivity;
  "mutations/roles": typeof mutations_roles;
  "mutations/teams": typeof mutations_teams;
  "mutations/users": typeof mutations_users;
  "queries/company": typeof queries_company;
  "queries/invitations": typeof queries_invitations;
  "queries/modules": typeof queries_modules;
  "queries/permissions": typeof queries_permissions;
  "queries/projects": typeof queries_projects;
  "queries/recentActivity": typeof queries_recentActivity;
  "queries/roles": typeof queries_roles;
  "queries/teams": typeof queries_teams;
  "queries/users": typeof queries_users;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
