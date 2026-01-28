# JSON到代码的映射关系说明

## 映射规则总结

| JSON字段 | 生成的代码 | 说明 |
|---------|-----------|------|
| `mcu_pin: "PA0"` | `#define LED1_PIN 0` | 提取引脚编号 |
| `component: "LED1"` | `LED1_ON()`, `LED1_OFF()` | 生成控制宏 |
| `direction: "output"` | `GPIOA_CRL |= (0x3 << ...)` | 配置为输出模式 |
| `active_level: "high"` | `LED1_ON() = ODR |= (1<<PIN)` | 高电平点亮 |
| `active_level: "low"` | `LED1_ON() = ODR &= ~(1<<PIN)` | 低电平点亮 |
| `direction: "input"` | `GPIOA_CRL |= (0x8 << ...)` | 配置为输入模式 |
| `pull_mode: "pull_up"` | `GPIOA_ODR |= (1 << PIN)` | 使能上拉 |
| `alternate_function: "USART1_TX"` | `GPIOA_CRH |= (0xB << ...)` | 配置复用功能 |

---

## 详细示例1: LED控制

### JSON输入:
```json
{
  "mcu_pin": "PA0",
  "component": "LED1",
  "direction": "output",
  "active_level": "high"
}
```

### 生成的代码:
```c
// 1. 宏定义
#define LED1_PIN 0
#define LED1_ON()  (GPIOA_ODR |= (1 << LED1_PIN))   // ← active_level="high"
#define LED1_OFF() (GPIOA_ODR &= ~(1 << LED1_PIN))

// 2. 初始化代码
void GPIO_Init(void) {
    // 配置PA0为输出 ← direction="output"
    GPIOA_CRL &= ~(0xF << (0 * 4));
    GPIOA_CRL |= (0x3 << (0 * 4));  // 推挽输出,50MHz
    
    LED1_OFF();  // 初始状态
}
```

---

## 详细示例2: 按键检测

### JSON输入:
```json
{
  "mcu_pin": "PA1",
  "component": "KEY1",
  "direction": "input",
  "active_level": "low",
  "pull_mode": "pull_up"
}
```

### 生成的代码:
```c
// 1. 宏定义
#define KEY1_PIN 1
#define KEY1_PRESSED() ((GPIOA_IDR & (1 << KEY1_PIN)) == 0)  // ← active_level="low"

// 2. 初始化代码
void GPIO_Init(void) {
    // 配置PA1为输入 ← direction="input"
    GPIOA_CRL &= ~(0xF << (1 * 4));
    GPIOA_CRL |= (0x8 << (1 * 4));  // 上拉/下拉输入模式
    
    // 使能上拉 ← pull_mode="pull_up"
    GPIOA_ODR |= (1 << KEY1_PIN);
}

// 3. 使用示例
if (KEY1_PRESSED()) {
    // 按键被按下
    LED1_ON();
}
```

---

## 详细示例3: UART通信

### JSON输入:
```json
{
  "interface": "USART1",
  "tx_pin": "PA9",
  "rx_pin": "PA10",
  "baud_rate": "115200"
}
```

### 生成的代码:
```c
// 1. 配置TX引脚(PA9)为复用推挽输出
void UART_GPIO_Init(void) {
    // PA9: USART1_TX
    GPIOA_CRH &= ~(0xF << ((9 - 8) * 4));
    GPIOA_CRH |= (0xB << ((9 - 8) * 4));  // 复用推挽
    
    // PA10: USART1_RX
    GPIOA_CRH &= ~(0xF << ((10 - 8) * 4));
    GPIOA_CRH |= (0x4 << ((10 - 8) * 4));  // 浮空输入
}

// 2. 配置UART波特率
void USART1_Init(void) {
    RCC_APB2ENR |= (1 << 14);  // 使能USART1时钟
    
    // 波特率115200 ← baud_rate="115200"
    USART1_BRR = 0x45;  // 计算公式: PCLK2/(16*baud_rate)
    
    // 使能USART
    USART1_CR1 = (1 << 13) | (1 << 3) | (1 << 2);
}
```

---

## 关键决策逻辑

### 1. 输出引脚的有效电平

```
如果 active_level == "high":
    ON  = 输出1 (ODR |= bit)
    OFF = 输出0 (ODR &= ~bit)

如果 active_level == "low":
    ON  = 输出0 (ODR &= ~bit)   ← 注意反过来!
    OFF = 输出1 (ODR |= bit)
```

### 2. 输入引脚的触发条件

```
如果 active_level == "low":
    PRESSED = (IDR & bit) == 0   // 读到0表示按下

如果 active_level == "high":
    PRESSED = (IDR & bit) != 0   // 读到1表示按下
```

### 3. GPIO模式配置

```
direction == "output":
    MODE = 11 (50MHz输出)
    CNF  = 00 (推挽输出)

direction == "input" && pull_mode == "pull_up":
    MODE = 00 (输入模式)
    CNF  = 10 (上拉/下拉输入)
    ODR  |= bit  (设置为上拉)

alternate_function != null:
    MODE = 11 (50MHz)
    CNF  = 10 (复用推挽输出, 用于TX)
    或
    CNF  = 01 (浮空输入, 用于RX)
```

---

## 为什么需要这些信息?

### ❌ 错误示例(没有JSON信息)

如果没有原理图分析,工程师只能这样写:

```c
// 不知道LED是高电平还是低电平有效...
GPIOA_ODR |= (1 << 0);  // 这样对吗?还是应该清零?

// 不知道按键有没有上拉电阻...
// 需要配置内部上拉吗?
```

### ✅ 正确示例(有JSON信息)

有了原理图分析的JSON,AI知道:

```c
// JSON告诉我: active_level="high"
LED1_ON()  = GPIOA_ODR |= (1 << 0);   // ✓ 高电平点亮

// JSON告诉我: pull_mode="pull_up", active_level="low"
GPIOA_CRL |= (0x8 << 4);  // 上拉输入
GPIOA_ODR |= (1 << 1);    // 使能上拉
KEY1_PRESSED() = (GPIOA_IDR & (1<<1)) == 0;  // ✓ 低电平表示按下
```

---

## 总结

**原理图分析的核心价值**:
1. 自动识别引脚功能(LED/按键/UART...)
2. 确定电气特性(高/低电平有效)
3. 生成正确的初始化代码
4. 避免硬件调试时的低级错误

这就是为什么你的系统需要"解析原理图"这一步!
