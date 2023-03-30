import { Configuration } from './Configuration';
import { RegisterValues } from './DeyeRegisters';
import { NodeOutput } from './NodeOutput';

/**
 * Stores events and a history of past events.
 */
export class Storage {
    private configuration: Configuration;

    private updating = false;
    private connectionError: string | null = null;
    private dataError: string | null = null;

    private data: RegisterValues | null = null;
    private lastDataAt: number | null = null;
    private lastConnectionErrorAt: number | null = null;
    private lastDataErrorAt: number | null = null;
    private available = true;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    public isUpdating(): boolean {
        return this.updating;
    }

    public setUpdating(value: boolean) {
        this.updating = value;
    }

    public getConnectionError(): string | null {
        return this.connectionError;
    }

    public setConnectionError(value: string | null) {
        this.connectionError = value;
        this.lastConnectionErrorAt = Date.now();
    }

    public getDataError(): string | null {
        return this.dataError;
    }

    public setDataError(value: string | null) {
        this.dataError = value;
        this.lastDataErrorAt = Date.now();
    }

    public getData(): NodeOutput | null {
        if (this.data === null || this.dataError !== null || !this.available) {
            return null;
        }

        if (this.connectionError && this.lastConnectionErrorAt && Date.now() - this.lastConnectionErrorAt > this.configuration.deviceTimeout * 60 * 1000) {
            this.available = false;
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
            isAvailable: this.available,
        };
    }

    public setData(data: RegisterValues) {
        this.data = data;
        this.lastDataAt = Date.now();
        this.connectionError = null;
        this.dataError = null;
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
