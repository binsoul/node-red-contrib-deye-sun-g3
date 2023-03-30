import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import packageJson from './package.json';

const allNodeTypes = Object.keys(packageJson['node-red'].nodes);

const htmlWatch = () => {
    return {
        name: 'htmlWatch',
        load(id) {
            const editorDir = path.dirname(id);
            const pattern = path.join(editorDir, '*.html').replace(/\\/g, '/');
            const htmlFiles = glob.sync(pattern);
            htmlFiles.map((file) => this.addWatchFile(file));
        },
    };
};

const htmlBundle = () => {
    return {
        name: 'htmlBundle',
        renderChunk(code, chunk) {
            const editorDir = path.dirname(chunk.facadeModuleId);
            const pattern = path.join(editorDir, '*.html').replace(/\\/g, '/');
            const htmlFiles = glob.sync(pattern);
            const htmlContents = htmlFiles.map((fPath) => fs.readFileSync(fPath));

            code = '<script type="text/javascript">\n' + code + '\n' + '</script>\n' + htmlContents.join('\n');

            return {
                code,
                map: { mappings: '' },
            };
        },
    };
};

const makePlugins = (nodeType) => [
    htmlWatch(),
    typescript({
        lib: ['es5', 'es6', 'dom'],
        include: [`src/${nodeType}/Node.html/**/*.ts`, `src/${nodeType}/**/*.d.ts`],
        target: 'es5',
        tsconfig: false,
        noEmitOnError: false,
    }),
    htmlBundle(),
];

const makeConfigItem = (nodeType) => ({
    input: `src/${nodeType}/Node.html/editor.ts`,
    output: {
        file: `dist/${nodeType}/Node.html`,
        format: 'iife',
        globals: {},
    },
    plugins: makePlugins(nodeType),
    watch: {
        clearScreen: false,
    },
});

export default allNodeTypes.map((nodeType) => makeConfigItem(nodeType.replace('binsoul-', '')));
