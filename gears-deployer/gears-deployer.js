#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Command } from "commander";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { rollup } from "rollup";
import { createClient } from "@redis/client";
import { resolve } from 'path';
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
function buildRedisGearsFunctionCode(rollupOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const rollupBuild = yield rollup(rollupOptions);
        const { output: [{ code }] } = yield rollupBuild.generate({ format: 'es' });
        return code;
    });
}
function deploy(client, functionCode) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield client.sendCommand(['TFUNCTION', 'LOAD', 'REPLACE', functionCode]);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const deployCommand = new Command('deploy');
        deployCommand
            .argument('<filename>')
            .option('-r, --redis <redis>')
            .action((filename, options) => __awaiter(this, void 0, void 0, function* () {
            const { redis } = options;
            const client = createClient({ url: redis });
            yield client.connect();
            const rollupOptions = {
                input: resolve(process.cwd(), filename),
                plugins: [
                    preserveShebangs(),
                    nodeResolve(),
                    typescript({
                        tsconfig: resolve(process.cwd(), 'tsconfig.json'), // Opcional: especifica un archivo de configuración de TypeScript
                    }),
                    commonjs(),
                    json({ compact: true })
                ],
            };
            const functionCode = yield buildRedisGearsFunctionCode(rollupOptions);
            return deploy(client, functionCode);
        }));
        return yield deployCommand.parseAsync();
    });
}
main().then(r => {
    console.log("Deployed!");
}).catch(error => {
    console.log(error);
});
//# sourceMappingURL=gears-deployer.js.map