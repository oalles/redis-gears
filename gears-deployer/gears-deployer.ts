#!/usr/bin/env node
import {Command} from "commander";
import {preserveShebangs} from "rollup-plugin-preserve-shebangs";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import {rollup, RollupOptions} from "rollup";
import {createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts} from "@redis/client";
import { resolve } from 'path';
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";


async function buildRedisGearsFunctionCode(rollupOptions: any): Promise<string> {
    const rollupBuild = await rollup(rollupOptions);
    const {output: [{code}]} = await rollupBuild.generate({format: 'es'});
    return code;
}

async function  deploy(client: any, functionCode: string) {
    return await client.sendCommand(['TFUNCTION', 'LOAD', 'REPLACE', functionCode]);
}

async function main() {
    const deployCommand = new Command('deploy');
    deployCommand
        .argument('<filename>')
        .option('-r, --redis <redis>')
        .action(async (filename: string, options: {redis: string}) => {
            const {redis} = options;
            const client:  RedisClientType<RedisModules, RedisFunctions, RedisScripts> = createClient({url: redis});
            await client.connect();

            const rollupOptions : RollupOptions = {
                input: resolve(process.cwd(), filename),
                plugins: [
                    preserveShebangs(),
                    nodeResolve(),
                    typescript({
                        tsconfig: resolve(process.cwd(), 'tsconfig.json'), // Opcional: especifica un archivo de configuración de TypeScript
                    }),
                    commonjs(),
                    json({compact: true})

                ],
            };
            const functionCode = await buildRedisGearsFunctionCode(rollupOptions);
            return deploy(client, functionCode);
        });
    return await deployCommand.parseAsync();
}

main().then(r => {
    console.log("Deployed!")
}).catch(error => {
    console.log(error);
});