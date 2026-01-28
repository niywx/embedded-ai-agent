/**
 * @file examples.js
 * @brief 示例运行脚本
 * @description 使用示例文件运行完整流程
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './pipeline.js';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 主函数
// ============================================================================

async function main() {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║   Embedded AI Agent - Example Runner    ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    try {
        // 示例文件路径
        const datasheetPath = path.join(__dirname, '..', 'examples', 'sample_datasheet.txt');
        const schematicPath = path.join(__dirname, '..', 'examples', 'sample_schematic.png');
        const outputPath = path.join(__dirname, '..', 'out', 'default_set_io.c');

        console.log('Using example files:');
        console.log(`  Datasheet:  ${datasheetPath}`);
        console.log(`  Schematic:  ${schematicPath}`);
        console.log(`  Output:     ${outputPath}`);
        console.log('');

        // 用户指令
        const instruction = '初始化所有 IO 为输出，并提供 LED 和按键控制函数';

        // 运行 Pipeline
        const result = await runPipeline({
            datasheet: datasheetPath,
            schematic: schematicPath,
            instruction: instruction,
            outputPath: outputPath
        });

        if (result.status === 'success') {
            console.log('\n✓ 示例运行成功！');
            console.log(`\n生成的代码已保存到: ${result.generated_code_path}`);
            console.log(`\n您可以查看生成的 C 代码文件。`);
        } else {
            console.error('\n✗ 示例运行失败');
            console.error(`错误: ${result.error_message}`);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n✗ 运行出错:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// ============================================================================
// 运行
// ============================================================================

main();
