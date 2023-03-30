import { Action, ActionFactory as ActionFactoryInterface, Message } from '@binsoul/node-red-bundle-processing';
import type { Node, NodeAPI } from '@node-red/registry';
import { NodeMessageInFlow } from 'node-red';
import { clearTimeout, setTimeout } from 'timers';
import { DailyResetAction } from './Action/DailyResetAction';
import { OutputAction } from './Action/OutputAction';
import { UpdateAction } from './Action/UpdateAction';
import type { Configuration } from './Configuration';
import { Storage } from './Storage';

interface MessageData extends NodeMessageInFlow {
    command?: string;
    timestamp?: number;
}

function formatTime(timestamp: number) {
    const date = new Date(timestamp);

    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

/**
 * Generates actions.
 */
export class ActionFactory implements ActionFactoryInterface {
    private readonly configuration: Configuration;
    private readonly RED: NodeAPI;
    private readonly node: Node;
    private readonly storage: Storage;
    private updateTimer: NodeJS.Timeout | null = null;
    private dailyResetTimer: NodeJS.Timeout | null = null;

    constructor(RED: NodeAPI, node: Node, configuration: Configuration) {
        this.RED = RED;
        this.node = node;
        this.configuration = configuration;
        this.storage = new Storage(configuration);
    }

    build(message: Message): Action | Array<Action> | null {
        const data: MessageData = message.data;
        const command = data.command;

        if (typeof command !== 'undefined' && ('' + command).trim() !== '') {
            switch (command.toLowerCase()) {
                case 'update':
                    this.storage.setUpdating(true);
                    return new UpdateAction(this.configuration, this.storage, () => {
                        this.node.receive(<MessageData>{
                            command: 'output',
                        });
                    });
                case 'output':
                    this.storage.setUpdating(false);
                    return new OutputAction(this.configuration, this.storage);

                case 'dailyreset':
                    return new DailyResetAction(this.configuration, this.storage);
            }
        }

        if (!this.storage.isUpdating()) {
            if (this.updateTimer !== null) {
                clearTimeout(this.updateTimer);
                this.updateTimer = null;
            }

            this.scheduleUpdate();

            this.storage.setUpdating(true);
            return new UpdateAction(this.configuration, this.storage, () => {
                this.node.receive(<MessageData>{
                    command: 'output',
                });
            });
        }

        return null;
    }

    setup(): void {
        if (this.configuration.updateMode === 'never') {
            this.node.status({
                fill: 'yellow',
                shape: 'dot',
                text: 'waiting for message',
            });

            return;
        }

        const now = Date.now();
        const firstUpdateAt = Math.ceil(now / (this.configuration.updateFrequency * 60000)) * this.configuration.updateFrequency * 60000;
        this.updateTimer = setTimeout(() => this.executeUpdate(), firstUpdateAt - now + 1000);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0);

        this.dailyResetTimer = setTimeout(() => this.executeDailyReset(), tomorrow.getTime() - now);

        this.node.status({
            fill: 'yellow',
            shape: 'dot',
            text: `waiting until ${formatTime(firstUpdateAt)}`,
        });
    }

    teardown(): void {
        if (this.updateTimer !== null) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        if (this.dailyResetTimer !== null) {
            clearTimeout(this.dailyResetTimer);
            this.dailyResetTimer = null;
        }
    }

    /**
     * Starts a timer if automatic updates are enabled and no timer exists.
     */
    private scheduleUpdate(): void {
        if (this.updateTimer !== null || this.configuration.updateMode === 'never') {
            return;
        }

        const now = new Date().getTime();
        this.updateTimer = setTimeout(() => this.executeUpdate(), this.getStartOfSlot(now) - now + this.configuration.updateFrequency * 60000 + 1000);
    }

    /**
     * Handles automatic updates.
     */
    executeUpdate(): void {
        const now = new Date().getTime();
        const nextUpdateAt = this.getStartOfSlot(now) + this.configuration.updateFrequency * 60000 + 1000;
        this.updateTimer = setTimeout(() => this.executeUpdate(), nextUpdateAt - now);

        // trigger node.on('input', () => {})
        this.node.receive(<MessageData>{
            command: 'update',
            timestamp: now,
        });
    }

    /**
     * Handles daily resets of counters.
     */
    executeDailyReset(): void {
        const now = Date.now();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0);

        this.dailyResetTimer = setTimeout(() => this.executeDailyReset(), tomorrow.getTime() - now);

        // trigger node.on('input', () => {})
        this.node.receive(<MessageData>{
            command: 'dailyReset',
            timestamp: now,
        });
    }

    private getStartOfSlot(timestamp: number) {
        return Math.floor(timestamp / 60000) * 60000;
    }
}
