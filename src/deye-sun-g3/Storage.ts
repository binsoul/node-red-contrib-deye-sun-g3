import { Configuration } from './Configuration';
import { RegisterValues } from './DeyeRegisters';
import { NodeOutput } from './NodeOutput';

/**
 * Stores events and a history of past events.
 */
export class Storage {
    private configuration: Configuration;

    private updating = false;
    private connected = false;

    private lastConnectionAt: number | null = null;
    private lastDataAt: number | null = null;
    private available = true;
    private data: RegisterValues | null = null;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    public isUpdating(): boolean {
        return this.updating;
    }

    public setUpdating(value: boolean) {
        this.updating = value;
        if (value) {
            this.connected = false;
        }
    }

    public setConnected() {
        this.connected = true;
        this.lastConnectionAt = Date.now();
        this.available = true;
    }

    public getData(): NodeOutput | null {
        if (this.data === null || !this.available) {
            return null;
        }

        const pv1 = {
            voltage: this.data.pv1Voltage,
            current: this.data.pv1Current,
            power: this.round(this.data.pv1Voltage * this.data.pv1Current, '4'),
        };

        const pv2 = {
            voltage: this.data.pv2Voltage,
            current: this.data.pv2Current,
            power: this.round(this.data.pv2Voltage * this.data.pv2Current, '4'),
        };

        const pv3 = {
            voltage: this.data.pv3Voltage,
            current: this.data.pv3Current,
            power: this.round(this.data.pv3Voltage * this.data.pv3Current, '4'),
        };

        const pv4 = {
            voltage: this.data.pv4Voltage,
            current: this.data.pv4Current,
            power: this.round(this.data.pv4Voltage * this.data.pv4Current, '4'),
        };

        const output = {
            power: this.data.acPower,
            voltage: this.data.acVoltage,
            current: this.data.acCurrent,
            frequency: this.data.acFrequency,
        };

        const counters = {
            totalEnergy: this.data.totalEnergy,
            pv1TotalEnergy: this.data.pv1TotalEnergy,
            pv2TotalEnergy: this.data.pv2TotalEnergy,
            pv3TotalEnergy: this.data.pv3TotalEnergy,
            pv4TotalEnergy: this.data.pv4TotalEnergy,
            totalEnergyToday: this.data.totalEnergyToday,
            pv1TotalEnergyToday: this.data.pv1TotalEnergyToday,
            pv2TotalEnergyToday: this.data.pv2TotalEnergyToday,
            pv3TotalEnergyToday: this.data.pv3TotalEnergyToday,
            pv4TotalEnergyToday: this.data.pv4TotalEnergyToday,
        };

        return {
            pv1: pv1,
            pv2: pv2,
            pv3: pv3,
            pv4: pv4,
            output: output,
            counters: counters,
            temperature: this.data.temperature,
            isAvailable: this.available,
        };
    }

    public setData(data: RegisterValues) {
        if (this.data !== null && this.data.totalEnergy > data.totalEnergy) {
            // totalEnergy should always increase while the node is running
            return;
        }

        this.data = data;
        this.lastDataAt = Date.now();
        this.available = true;
    }

    public resetCounters(): void {
        if (this.data !== null) {
            this.data.pv1TotalEnergyToday = 0;
            this.data.pv2TotalEnergyToday = 0;
            this.data.pv3TotalEnergyToday = 0;
            this.data.pv4TotalEnergyToday = 0;
            this.data.totalEnergyToday = 0;
        }
    }

    public resetRuntime(): void {
        if (this.data !== null) {
            this.data.pv1Voltage = 0;
            this.data.pv1Current = 0;
            this.data.pv2Voltage = 0;
            this.data.pv2Current = 0;
            this.data.pv3Voltage = 0;
            this.data.pv3Current = 0;
            this.data.pv4Voltage = 0;
            this.data.pv4Current = 0;
            this.data.acFrequency = 0;
            this.data.acPower = 0;
            this.data.acVoltage = 0;
            this.data.acCurrent = 0;
            this.data.uptime = 0;
            this.data.operatingPower = 0;
            this.data.temperature = null;
        }
    }

    public isAvailable(): boolean {
        return this.available;
    }

    public setAvailable(value: boolean): void {
        this.available = value;
    }

    private round(value: number, decimals: string): number {
        return Number(Math.round(<number>(<unknown>(value + 'e' + decimals))) + 'e-' + decimals);
    }
}
