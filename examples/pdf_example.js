// ==============================================================================
// 使用 PDF 文件的完整示例
// ==============================================================================
// 本示例展示如何使用 PDF 格式的数据手册和原理图
// ==============================================================================

import { runPipeline } from '../src/pipeline.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPDFExample() {
    console.log('========================================');
    console.log('PDF 文件处理示例');
    console.log('========================================\n');

    // 示例 1: 使用工作区中的 PDF 数据手册
    const example1 = {
        datasheet: path.join(__dirname, '..', '..', 'BF7615CMXX.pdf'),
        schematic: path.join(__dirname, 'sample_schematic.png'),
        instruction: '根据数据手册生成 GPIO 初始化代码，包括寄存器配置',
        outputPath: path.join(__dirname, '..', 'out', 'bf7615_gpio_init.c')
    };

    // 示例 2: 模拟使用 PDF 原理图（文本模式）
    const example2 = {
        datasheet: path.join(__dirname, 'sample_datasheet.txt'),
        schematic: path.join(__dirname, 'sample_schematic_description.txt'), // 文本描述的原理图
        instruction: '实现 LED 闪烁和按键检测功能',
        outputPath: path.join(__dirname, '..', 'out', 'led_button_demo.c')
    };

    try {
        console.log('📄 示例 1: 使用实际 PDF 数据手册');
        console.log('='.repeat(50));
        console.log(`Datasheet: ${example1.datasheet}`);
        console.log(`Schematic: ${example1.schematic}`);
        console.log(`Output: ${example1.outputPath}\n`);

        // 检查 PDF 文件是否存在
        const fs = await import('fs-extra');
        if (await fs.pathExists(example1.datasheet)) {
            console.log('✓ PDF 文件存在，开始处理...\n');
            
            await runPipeline({
                datasheet: example1.datasheet,
                schematic: example1.schematic,
                instruction: example1.instruction,
                outputPath: example1.outputPath
            });

            console.log('\n✓ 示例 1 完成！');
            console.log(`生成的代码已保存到: ${example1.outputPath}\n`);
        } else {
            console.log('⚠️ PDF 文件不存在，跳过示例 1');
            console.log(`   请确保文件路径正确: ${example1.datasheet}\n`);
        }

        console.log('\n📝 示例 2: 使用文本描述的原理图');
        console.log('='.repeat(50));
        console.log(`Datasheet: ${example2.datasheet}`);
        console.log(`Schematic: ${example2.schematic}`);
        console.log(`Output: ${example2.outputPath}\n`);

        await runPipeline({
            datasheet: example2.datasheet,
            schematic: example2.schematic,
            instruction: example2.instruction,
            outputPath: example2.outputPath
        });

        console.log('\n✓ 示例 2 完成！');
        console.log(`生成的代码已保存到: ${example2.outputPath}\n`);

        console.log('\n========================================');
        console.log('✓ 所有示例运行完成！');
        console.log('========================================');

    } catch (error) {
        console.error('\n❌ 示例运行失败:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// ==============================================================================
// PDF 处理说明
// ==============================================================================

function printPDFGuide() {
    console.log('\n' + '='.repeat(70));
    console.log('PDF 原理图处理指南');
    console.log('='.repeat(70));
    console.log('\n📌 系统支持的文件格式：');
    console.log('   Datasheet: PDF, TXT, MD');
    console.log('   Schematic: PDF, PNG, JPG, JPEG, BMP, TXT\n');
    
    console.log('📌 PDF 原理图的两种处理方式：\n');
    
    console.log('   方式 1: 文本提取模式（当前默认）');
    console.log('   ✓ 直接使用 PDF 文件');
    console.log('   ✓ 系统自动提取文本内容');
    console.log('   ✓ 适用于包含文本描述的 PDF\n');
    
    console.log('   方式 2: 视觉模型模式（推荐）');
    console.log('   ✓ 先将 PDF 转换为 PNG/JPG');
    console.log('   ✓ 使用 Qwen 视觉模型分析');
    console.log('   ✓ 适用于图形化的电路图\n');
    
    console.log('📌 PDF 转图片命令（Windows PowerShell）：\n');
    console.log('   # 使用 ImageMagick');
    console.log('   magick convert -density 300 schematic.pdf schematic.png\n');
    console.log('   # 或使用 Ghostscript');
    console.log('   gswin64c -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 ^');
    console.log('            -sOutputFile=schematic.png schematic.pdf\n');
    
    console.log('📌 使用辅助脚本自动转换：\n');
    console.log('   .\\examples\\process_pdf_schematic.ps1 datasheet.pdf schematic.pdf "初始化GPIO"\n');
    
    console.log('='.repeat(70) + '\n');
}

// 运行示例
console.log('\n');
printPDFGuide();
runPDFExample();
