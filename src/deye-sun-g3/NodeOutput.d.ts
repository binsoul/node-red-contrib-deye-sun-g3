interface PV {
    voltage: number;
    current: number;
    power: number;
}

interface Output {
    power: number;
    voltage: number;
    current: number;
    frequency: number;
}

interface Counters {
    totalEnergy: number;
    totalEnergyToday: number;
    pv1TotalEnergy: number;
    pv1TotalEnergyToday: number;
    pv2TotalEnergy: number;
    pv2TotalEnergyToday: number;
    pv3TotalEnergy: number;
    pv3TotalEnergyToday: number;
    pv4TotalEnergy: number;
    pv4TotalEnergyToday: number;
}

export interface NodeOutput {
    pv1: PV;
    pv2: PV;
    pv3: PV;
    pv4: PV;
    output: Output;
    counters: Counters;
    temperature: number | null;
    isAvailable: boolean;
}
