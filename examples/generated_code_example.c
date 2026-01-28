/**
 * @file gpio_init.c
 * @brief 基于原理图自动生成的GPIO初始化代码
 * @note 根据 pin_mapping_example.json 生成
 */

#include <stdint.h>

// ============================================================================
// 寄存器定义
// ============================================================================

#define GPIOA_BASE  0x40010800
#define GPIOC_BASE  0x40011000
#define RCC_BASE    0x40021000

#define GPIOA_CRL   (*((volatile uint32_t*)(GPIOA_BASE + 0x00)))
#define GPIOA_CRH   (*((volatile uint32_t*)(GPIOA_BASE + 0x04)))
#define GPIOA_ODR   (*((volatile uint32_t*)(GPIOA_BASE + 0x0C)))
#define GPIOA_IDR   (*((volatile uint32_t*)(GPIOA_BASE + 0x08)))

#define GPIOC_CRH   (*((volatile uint32_t*)(GPIOC_BASE + 0x04)))
#define GPIOC_ODR   (*((volatile uint32_t*)(GPIOC_BASE + 0x0C)))

#define RCC_APB2ENR (*((volatile uint32_t*)(RCC_BASE + 0x18)))

// ============================================================================
// 引脚宏定义 (根据JSON的pin_mappings自动生成)
// ============================================================================

// LED1 控制 (PA0, 高电平点亮)
#define LED1_PIN    0
#define LED1_ON()   (GPIOA_ODR |= (1 << LED1_PIN))
#define LED1_OFF()  (GPIOA_ODR &= ~(1 << LED1_PIN))
#define LED1_TOGGLE() (GPIOA_ODR ^= (1 << LED1_PIN))

// 按键KEY1读取 (PA1, 低电平有效)
#define KEY1_PIN    1
#define KEY1_PRESSED()  ((GPIOA_IDR & (1 << KEY1_PIN)) == 0)

// 蜂鸣器控制 (PC13, 高电平响)
#define BUZZER_PIN  13
#define BUZZER_ON()   (GPIOC_ODR |= (1 << BUZZER_PIN))
#define BUZZER_OFF()  (GPIOC_ODR &= ~(1 << BUZZER_PIN))

// ============================================================================
// GPIO初始化函数 (根据JSON的input_pins/output_pins自动生成)
// ============================================================================

/**
 * @brief GPIO初始化
 * @note 配置:
 *       - PA0: 输出 (LED1, 高电平有效)
 *       - PA1: 输入 (KEY1, 上拉, 低电平有效)
 *       - PA9: 复用 (USART1_TX)
 *       - PA10: 复用 (USART1_RX)
 *       - PC13: 输出 (蜂鸣器, 高电平有效)
 */
void GPIO_Init(void) {
    // 1. 使能时钟
    RCC_APB2ENR |= (1 << 2);  // GPIOA时钟
    RCC_APB2ENR |= (1 << 4);  // GPIOC时钟
    
    // 2. 配置PA0 (LED1) - 推挽输出,50MHz
    //    根据JSON: direction="output", active_level="high"
    GPIOA_CRL &= ~(0xF << (LED1_PIN * 4));
    GPIOA_CRL |= (0x3 << (LED1_PIN * 4));  // MODE=11, CNF=00
    LED1_OFF();  // 初始状态:熄灭
    
    // 3. 配置PA1 (KEY1) - 上拉输入
    //    根据JSON: direction="input", active_level="low", pull_mode="pull_up"
    GPIOA_CRL &= ~(0xF << (KEY1_PIN * 4));
    GPIOA_CRL |= (0x8 << (KEY1_PIN * 4));  // MODE=00, CNF=10(上拉/下拉)
    GPIOA_ODR |= (1 << KEY1_PIN);          // 上拉
    
    // 4. 配置PA9 (USART1_TX) - 复用推挽输出
    //    根据JSON: alternate_function="USART1_TX"
    GPIOA_CRH &= ~(0xF << ((9 - 8) * 4));
    GPIOA_CRH |= (0xB << ((9 - 8) * 4));  // MODE=11, CNF=10(复用推挽)
    
    // 5. 配置PA10 (USART1_RX) - 浮空/上拉输入
    //    根据JSON: alternate_function="USART1_RX"
    GPIOA_CRH &= ~(0xF << ((10 - 8) * 4));
    GPIOA_CRH |= (0x4 << ((10 - 8) * 4));  // MODE=00, CNF=01(浮空)
    
    // 6. 配置PC13 (蜂鸣器) - 推挽输出,50MHz
    //    根据JSON: direction="output", active_level="high"
    GPIOC_CRH &= ~(0xF << ((BUZZER_PIN - 8) * 4));
    GPIOC_CRH |= (0x3 << ((BUZZER_PIN - 8) * 4));  // MODE=11, CNF=00
    BUZZER_OFF();  // 初始状态:关闭
}

// ============================================================================
// UART初始化 (根据JSON的communication_interfaces自动生成)
// ============================================================================

#define USART1_BASE 0x40013800
#define USART1_SR   (*((volatile uint32_t*)(USART1_BASE + 0x00)))
#define USART1_DR   (*((volatile uint32_t*)(USART1_BASE + 0x04)))
#define USART1_BRR  (*((volatile uint32_t*)(USART1_BASE + 0x08)))
#define USART1_CR1  (*((volatile uint32_t*)(USART1_BASE + 0x0C)))

/**
 * @brief USART1初始化
 * @note 根据JSON配置:
 *       - 波特率: 115200
 *       - 用途: 与PC通信(通过CH340 USB转串口)
 */
void USART1_Init(void) {
    // 1. 使能USART1时钟
    RCC_APB2ENR |= (1 << 14);
    
    // 2. 配置波特率 (假设PCLK2=8MHz)
    //    BRR = 8000000 / (16 * 115200) ≈ 4.34 → 0x45
    USART1_BRR = 0x45;
    
    // 3. 使能USART、发送、接收
    USART1_CR1 = (1 << 13) |  // UE: USART使能
                 (1 << 3) |   // TE: 发送使能
                 (1 << 2);    // RE: 接收使能
}

// ============================================================================
// 应用层示例
// ============================================================================

/**
 * @brief 发送字符串到UART
 */
void UART_SendString(const char *str) {
    while (*str) {
        while (!(USART1_SR & (1 << 7)));  // 等待TXE=1
        USART1_DR = *str++;
    }
}

/**
 * @brief 简单延时
 */
void delay_ms(uint32_t ms) {
    for (uint32_t i = 0; i < ms * 1000; i++) {
        __asm("nop");
    }
}

/**
 * @brief 主函数示例
 */
int main(void) {
    // 系统初始化
    GPIO_Init();
    USART1_Init();
    
    UART_SendString("System Started!\r\n");
    
    while (1) {
        // 按键控制LED
        if (KEY1_PRESSED()) {
            LED1_ON();
            BUZZER_ON();
            UART_SendString("Button Pressed\r\n");
            delay_ms(100);  // 消抖
        } else {
            LED1_OFF();
            BUZZER_OFF();
        }
        
        delay_ms(10);
    }
}
