import { OrchestratorService } from './OrchestratorService';
import { ScoutService } from './ScoutService';
import { GuardianService } from './GuardianService';
import { SimulationService } from './SimulationService';
import { IntegromatService } from './IntegromatService';
import { ArchimedesService } from './ArchimedesService';
import { AletheaService } from './AletheaService';
import { ChronosService } from './ChronosService';
import { IAgent, THiveAgent } from '../../../types';

export const Microservices: Record<THiveAgent | string, IAgent> = {
    Orchestrator: new OrchestratorService(),
    Scout: new ScoutService(),
    Guardian: new GuardianService(),
    Simulation: new SimulationService(),
    Integromat: new IntegromatService(),
    Archimedes: new ArchimedesService(),
    Alethea: new AletheaService(),
    Chronos: new ChronosService(),
};
