/**
 * Friendly names for backend schemas.
 * `api.ts` is generated from FastAPI's OpenAPI spec — never edit it by hand.
 * Regenerate after backend schema changes:  npm run gen:api
 */
import type { components } from "./api";

type Schemas = components["schemas"];

export type User = Schemas["UserResponse"];
export type UserRole = Schemas["UserRole"];
export type Contract = Schemas["ContractResponse"];
export type ContractCreate = Schemas["ContractCreate"];
export type ContractStatus = Contract["status"];
export type ContractDetails = Schemas["ContractDetailsResponse"];
export type Party = Schemas["PartyResponse"];
export type Clause = Schemas["ClauseResponse"];
export type ContractEvent = Schemas["EventResponse"];
export type Obligation = Schemas["ObligationResponse"];
export type PaymentTerm = Schemas["PaymentTermResponse"];
export type Penalty = Schemas["PenaltyResponse"];
export type Notification = Schemas["NotificationResponse"];
export type AlertItem = Schemas["AlertItem"];
export type DashboardSummary = Schemas["DashboardSummary"];
