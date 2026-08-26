import type {
  Instrument,
  PlayerSafeProjection,
  PreparationPlan,
  StableId,
} from "@long-map/protocol";
import type { CommandIntent } from "../authority";

export type DispatchIntent = (intent: CommandIntent) => void;

export interface MissionControlProps {
  projection: PlayerSafeProjection;
  selectedInstruments: Instrument[];
  setSelectedInstruments: (next: Instrument[]) => void;
  selectedCommissionId: StableId | null;
  setSelectedCommissionId: (next: StableId | null) => void;
  preparation: PreparationPlan;
  setPreparation: (next: PreparationPlan) => void;
  selectedReports: StableId[];
  setSelectedReports: (next: StableId[]) => void;
  dispatch: DispatchIntent;
  disabled: boolean;
}
