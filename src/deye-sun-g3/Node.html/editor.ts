import type { EditorNodeProperties, EditorRED } from 'node-red';
import type { UserConfigurationOptions } from '../UserConfiguration';

declare const RED: EditorRED;

interface NodeEditorProperties extends EditorNodeProperties, UserConfigurationOptions {}

RED.nodes.registerType<NodeEditorProperties>('binsoul-deye-sun-g3', {
    category: 'device',
    color: '#4594d1',
    defaults: {
        outputProperty: {
            value: 'payload',
            required: true,
        },
        outputTarget: {
            value: 'msg',
            required: true,
        },
        deviceIp: {
            value: '192.168.33.1',
            required: true,
        },
        deviceSerialNumber: {
            value: '',
            required: true,
        },
        deviceTimeout: {
            value: 30,
            required: true,
            validate: RED.validators.number(),
        },
        updateMode: {
            value: 'never',
            required: true,
        },
        updateFrequency: {
            value: 5,
            required: true,
            validate: RED.validators.number(),
        },
        name: { value: '' },
    },
    inputs: 1,
    outputs: 1,
    icon: 'font-awesome/fa-share-square-o',
    label: function () {
        return this.name || 'Deye SUN G3';
    },
    labelStyle: function () {
        return this.name ? 'node_label_italic' : '';
    },
    paletteLabel: 'Deye SUN G3',
    inputLabels: 'Incoming message',
    outputLabels: ['Outgoing message'],
    oneditprepare: function () {
        setTimeout(() => {
            $('.binsoul-deye-sun-g3-wrapper').css('width', '100%');
            $('.binsoul-deye-sun-g3-wrapper .red-ui-typedInput-container').css({
                width: 'auto',
                display: 'flex',
            });
        });

        $('#node-input-outputProperty').typedInput({
            typeField: '#node-input-outputTarget',
            types: ['msg', 'flow', 'global'],
            default: 'msg',
        });
    },
});
