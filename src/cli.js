/**
 * @file cli.js
 * @brief 命令行接口
 * @description 提供命令行方式运行 Pipeline
 */

import { Command } from 'commander';
import path from 'path';
import { runPipeline } from './pipeline.js';

// ============================================================================
// 命令行程序
// ============================================================================

const program = new Command();

program
    .name('embedded-ai-agent')
    .description('嵌入式 AI 代码生成工具')
    .version('1.0.0');

program
    .requiredOption('-d, --datasheet <path>', 'Datasheet 文件路径 (PDF/TXT)')
    .requiredOption('-s, --schematic <path>', '原理图文件路径 (PDF/PNG/JPG)')
    .requiredOption('-i, --instruction <text>', '代码生成指令')
    .option('-o, --output <path>', '输出文件路径', 'out/default_set_io.c')
    .action(async (options) => {
        try {
            console.log('\n=== Embedded AI Agent CLI ===\n');
            console.log('Options:');
            console.log(`  Datasheet:   ${options.datasheet}`);
            console.log(`  Schematic:   ${options.schematic}`);
            console.log(`  Instruction: ${options.instruction}`);
            console.log(`  Output:      ${options.output}`);
            console.log('');

            // 运行 Pipeline
            const result = await runPipeline({
                datasheet: options.datasheet,
                schematic: options.schematic,
                instruction: options.instruction,
                outputPath: options.output
            });

            if (result.status === 'success') {
                console.log('\n✓ 代码生成成功！');
                console.log(`\n输出文件: ${result.generated_code_path}`);
                console.log(`代码行数: ${result.generated_code_lines}`);
                console.log(`用时: ${result.elapsed}`);
                process.exit(0);
            } else {
                console.error('\n✗ 代码生成失败');
                console.error(`错误: ${result.error_message}`);
                process.exit(1);
            }

        } catch (error) {
            console.error('\n✗ 运行出错:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    });

// 解析命令行参数
program.parse(process.argv);
