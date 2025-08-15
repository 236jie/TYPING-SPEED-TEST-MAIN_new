// DOM元素获取
const testItem = document.getElementById("textDisplay");
const inputItem = document.getElementById("textInput");
const timeName = document.getElementById("timeName");
const time = document.getElementById("time");
const cwName = document.getElementById("cwName");
const cw = document.getElementById("cw");
const restartBtn = document.getElementById("restartBtn");
const thirty = document.getElementById("thirty");
const sixty = document.getElementById("sixty");
const singleChar = document.getElementById("singleChar");
const pinyin = document.getElementById("pinyin");
const soundToggle = document.getElementById("soundToggle");
const charSpeakToggle = document.getElementById("charSpeakToggle");

// 页面元素
const mainPage = document.getElementById("mainPage");
const resultPage = document.getElementById("resultPage");
const backToPractice = document.getElementById("backToPractice");
const newPractice = document.getElementById("newPractice");

// 统计结果页面元素
const practiceMode = document.getElementById("practiceMode");
const practiceTime = document.getElementById("practiceTime");
const totalInput = document.getElementById("totalInput");
const correctInput = document.getElementById("correctInput");
const accuracy = document.getElementById("accuracy");
const charPerMinute = document.getElementById("charPerMinute");

// 语音合成API
let speechSynthesis = window.speechSynthesis;
let speechUtterance = null;
let soundEnabled = true; // 音效开关状态
let charSpeakEnabled = true; // 字符朗读开关状态

// 练习状态变量
var wordNo = 1;
var wordsSubmitted = 0;
var wordsCorrect = 0;
var timer = 30;
var flag = 0;
var factor = 2;
var seconds;
var practiceType = "singleChar"; // 练习类型：singleChar 或 pinyin
var startTime = 0; // 练习开始时间
var endTime = 0; // 练习结束时间

// 键盘字符数组（用于单字符练习）
const keyboardChars = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+',
  '[', ']', '{', '}', '\\', '|', ';', ':', '"', "'", ',', '.', '<', '>', '/', '?',
  '`', '~'
];

// 拼音练习内容 - 单个拼音字符
const pinyinContent = [
  "ni", "hao", "wo", "shi", "xie", "bu", "ke", "qi", "zao", "shang", "wan", "qing", "wen", "dui", "mei", "guan", "xi", "hen", "gao", "xing",
  "da", "jia", "lao", "tong", "xue", "peng", "you", "ren", "gong", "zuo", "xue", "sheng", "huo", "shen", "ti", "xin", "qing", "tian", "jin", "tian",
  "ming", "zuo", "xian", "zai", "yi", "qian", "hou", "shang", "xia", "zuo", "you", "qian", "men", "ta", "wan", "shua", "duo", "shao", "dong", "qian",
  "shi", "jian", "xi", "huan", "ge", "ge", "jie", "jie", "mei", "mei", "di", "di", "ba", "ba", "ma", "ma", "ye", "ye", "nai", "nai", "gong", "gong",
  "po", "po", "shu", "shu", "gu", "gu", "yi", "yi", "er", "san", "si", "wu", "liu", "qi", "ba", "jiu", "shi", "bai", "qian", "wan", "yi"
];

// 音效功能函数
function playCorrectSound(char) {
  if (!soundEnabled) return; // 如果音效关闭，直接返回
  
  // 使用Web Audio API生成正确音效
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 高频音调
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.log('Web Audio API不可用:', e);
  }
  
  // 语音读出字符
  if (speechSynthesis && char) {
    // 取消之前的语音
    if (speechUtterance) {
      speechSynthesis.cancel();
    }
    
    speechUtterance = new SpeechSynthesisUtterance(char);
    speechUtterance.rate = 1.5; // 语速稍快
    speechUtterance.pitch = 1.2; // 音调稍高
    speechUtterance.volume = 0.8; // 音量适中
    speechSynthesis.speak(speechUtterance);
  }
}

function playErrorSound() {
  if (!soundEnabled) return; // 如果音效关闭，直接返回
  
  // 使用Web Audio API生成错误音效
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // 低频音调
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.log('Web Audio API不可用:', e);
  }
}

// 初始化显示
displayTest(practiceType);

// 输入事件监听
inputItem.addEventListener('input', function(event) {
  if (flag === 0) {
    flag = 1;
    startTime = Date.now();
    timeStart();
  }
  
  var charEntered = event.data;
  
  // 检查输入是否正确并播放相应音效
  if (charEntered) {
    const currentID = "word " + wordNo;
    const currentSpan = document.getElementById(currentID);
    if (currentSpan) {
      const curSpanWord = currentSpan.innerText;
      const wordEntered = inputItem.value;
      
      if (wordEntered === curSpanWord.substring(0, wordEntered.length)) {
        // 输入正确，播放正确音效并读出字符
        playCorrectSound(charEntered);
      } else {
        // 输入错误，播放错误音效
        playErrorSound();
      }
    }
  }
  
  if (/\s/g.test(charEntered)) {  // 检查是否为空格
    checkWord();
  } else {
    currentWord();
  }
});

// 添加键盘焦点事件监听，当输入框获得焦点时读出当前需要输入的字符
inputItem.addEventListener('focus', function() {
  // 读出当前需要输入的字符
  speakCurrentChar();
});

// 添加键盘按下事件监听，在输入前读出当前字符
inputItem.addEventListener('keydown', function(event) {
  // 如果不是特殊键（如方向键、功能键等），则读出当前字符
  if (!event.ctrlKey && !event.altKey && !event.metaKey && 
      event.key.length === 1 && event.key !== ' ') {
    // 在输入前读出当前需要输入的字符
    speakCurrentChar();
  }
});

// 新增函数：读出当前需要输入的字符
function speakCurrentChar() {
  if (!soundEnabled || !charSpeakEnabled) return; // 如果音效或字符朗读关闭，直接返回
  
  const currentID = "word " + wordNo;
  const currentSpan = document.getElementById(currentID);
  if (currentSpan && speechSynthesis) {
    const curSpanWord = currentSpan.innerText.trim();
    
    // 取消之前的语音
    if (speechUtterance) {
      speechSynthesis.cancel();
    }
    
    // 根据练习类型调整朗读内容
    let speakText = curSpanWord;
    if (practiceType === "singleChar") {
      // 单字符模式：对于大写字母加上"大写"前缀
      if (curSpanWord.length === 1) {
        if (curSpanWord >= 'A' && curSpanWord <= 'Z') {
          speakText = "大写" + curSpanWord;
        } else {
          speakText = curSpanWord;
        }
      }
    } else {
      // 拼音模式：直接读出拼音
      speakText = curSpanWord;
    }
    
    // 创建语音合成对象
    speechUtterance = new SpeechSynthesisUtterance(speakText);
    speechUtterance.rate = 1.0; // 正常语速
    speechUtterance.pitch = 1.0; // 正常音调
    speechUtterance.volume = 0.8; // 音量适中
    speechUtterance.lang = 'zh-CN'; // 设置中文语音
    
    // 播放语音
    speechSynthesis.speak(speechUtterance);
  }
}

// 时间选择
thirty.addEventListener("click", function() {
  timer = 30;
  factor = 2;
  limitColor(thirty, sixty);
  time.innerText = timer;
  time.setAttribute('aria-label', '练习时间：30秒');
});

sixty.addEventListener("click", function() {
  timer = 60;
  factor = 1;
  limitColor(sixty, thirty);
  time.innerText = timer;
  time.setAttribute('aria-label', '练习时间：60秒');
});

// 练习类型选择
singleChar.addEventListener("click", function() {
  practiceType = "singleChar";
  displayTest(practiceType);
  limitColor(singleChar, pinyin);
  singleChar.setAttribute('aria-label', '当前模式：单字符练习');
  
  // 切换模式后，如果字符朗读开启，读出第一个字符
  setTimeout(() => {
    if (charSpeakEnabled && soundEnabled) {
      speakCurrentChar();
    }
  }, 300);
});

pinyin.addEventListener("click", function() {
  practiceType = "pinyin";
  displayTest(practiceType);
  limitColor(pinyin, singleChar);
  pinyin.setAttribute('aria-label', '当前模式：拼音练习');
  
  // 切换模式后，如果字符朗读开启，读出第一个字符
  setTimeout(() => {
    if (charSpeakEnabled && soundEnabled) {
      speakCurrentChar();
    }
  }, 300);
});

// 音效开关
soundToggle.addEventListener("click", function() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundToggle.innerText = "🔊 音效开启";
    soundToggle.classList.add("yellow");
    soundToggle.setAttribute('aria-label', '音效已开启');
  } else {
    soundToggle.innerText = "🔇 音效关闭";
    soundToggle.classList.remove("yellow");
    soundToggle.setAttribute('aria-label', '音效已关闭');
  }
});

// 字符朗读开关
charSpeakToggle.addEventListener("click", function() {
  charSpeakEnabled = !charSpeakEnabled;
  if (charSpeakEnabled) {
    charSpeakToggle.innerText = "🔊 字符朗读开启";
    charSpeakToggle.classList.add("yellow");
    charSpeakToggle.setAttribute('aria-label', '字符朗读已开启');
  } else {
    charSpeakToggle.innerText = "🔇 字符朗读关闭";
    charSpeakToggle.classList.remove("yellow");
    charSpeakToggle.setAttribute('aria-label', '字符朗读已关闭');
  }
});

// 设置颜色
function limitColor(itema, itemr) {
  itema.classList.add('yellow');
  itemr.classList.remove('yellow');
}

// 重新开始练习
restartBtn.addEventListener("click", function() {
  wordsSubmitted = 0;
  wordsCorrect = 0;
  flag = 0;
  startTime = 0; // 重置开始时间
  endTime = 0; // 重置结束时间

  time.classList.remove("current");
  cw.classList.remove("current");
  time.innerText = timer;
  timeName.innerText = "时间";
  cw.innerText = wordsCorrect;
  cwName.innerText = "正确字符数";
  inputItem.disabled = false;
  inputItem.value = '';
  inputItem.focus();

  // 停止所有音效和语音
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }

  displayTest(practiceType);
  clearInterval(seconds);
  limitVisible();
  
  // 重新开始后，如果字符朗读开启，读出第一个字符
  setTimeout(() => {
    if (charSpeakEnabled && soundEnabled) {
      speakCurrentChar();
    }
  }, 500);
});

// 开始计时器倒计时
function timeStart() {
  limitInvisible();
  seconds = setInterval(function() {
    time.innerText--;
    if (time.innerText == "-1") {
      timeOver();
      clearInterval(seconds);
    }
  }, 1000);
}

// 练习结束
function timeOver() {
  inputItem.disabled = true;
  restartBtn.focus();
  
  // 记录练习结束时间
  endTime = Date.now();

  // 停止所有音效和语音
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }

  displayScore();
}

// 设置限制可见性
function limitVisible() {
  thirty.style.visibility = 'visible';
  sixty.style.visibility = 'visible';
  singleChar.style.visibility = 'visible';
  pinyin.style.visibility = 'visible';
}

function limitInvisible() {
  thirty.style.visibility = 'hidden';
  sixty.style.visibility = 'hidden';
  singleChar.style.visibility = 'hidden';
  pinyin.style.visibility = 'hidden';
}

// 显示统计结果
function displayScore() {
  let percentageAcc = 0;
  if (wordsSubmitted !== 0) {
    percentageAcc = Math.floor((wordsCorrect / wordsSubmitted) * 100);
  }

  time.classList.add("current");
  cw.classList.add("current");

  time.innerText = percentageAcc + "%";
  timeName.innerText = "准确率";

  cw.innerText = factor * wordsCorrect;
  cwName.innerText = "每分钟字符数";

  // 显示结果页面
  showResultPage();
}

// 显示结果页面
function showResultPage() {
  mainPage.style.display = 'none';
  resultPage.style.display = 'block';
  
  // 计算实际练习时间（从开始输入到结束输入）
  let actualTime = 0;
  if (startTime > 0 && endTime > 0) {
    actualTime = Math.round((endTime - startTime) / 1000);
  } else {
    // 如果没有记录时间，使用预设的练习时间
    actualTime = timer;
  }
  
  // 填充统计结果
  practiceMode.innerText = practiceType === "singleChar" ? "单字符练习" : "拼音练习";
  practiceTime.innerText = actualTime + "秒";
  totalInput.innerText = wordsSubmitted;
  correctInput.innerText = wordsCorrect;
  accuracy.innerText = wordsSubmitted > 0 ? Math.floor((wordsCorrect / wordsSubmitted) * 100) + "%" : "0%";
  const avgCorrectPerMinute = actualTime > 0 ? Math.round((wordsCorrect * 60) / actualTime) : 0;
  charPerMinute.innerText = avgCorrectPerMinute;
  
  // 语音播报结果
  if (speechSynthesis) {
    const resultText = `练习完成。总输入${wordsSubmitted}个字符，正确${wordsCorrect}个，准确率${accuracy.innerText}，平均每分钟正确字符数${charPerMinute.innerText}个。`;
    speechUtterance = new SpeechSynthesisUtterance(resultText);
    speechUtterance.rate = 1.0;
    speechUtterance.pitch = 1.0;
    speechUtterance.volume = 0.8;
    speechSynthesis.speak(speechUtterance);
  }
}

// 返回练习页面
backToPractice.addEventListener("click", function() {
  resultPage.style.display = 'none';
  mainPage.style.display = 'block';
  restartBtn.click(); // 重新开始练习
});

// 开始新练习
newPractice.addEventListener("click", function() {
  resultPage.style.display = 'none';
  mainPage.style.display = 'block';
  restartBtn.click(); // 重新开始练习
});

// 检查当前输入是否正确
function currentWord() {
  const wordEntered = inputItem.value;
  const currentID = "word " + wordNo;
  const currentSpan = document.getElementById(currentID);
  const curSpanWord = currentSpan.innerText;

  if (wordEntered == curSpanWord.substring(0, wordEntered.length)) {
    colorSpan(currentID, 2);
  } else {
    colorSpan(currentID, 3);
  }
}

// 检查输入的词
function checkWord() {
  const wordEntered = inputItem.value;
  inputItem.value = '';

  const wordID = "word " + wordNo;
  const checkSpan = document.getElementById(wordID);
  wordNo++;
  wordsSubmitted++;

  // 去除末尾空格进行比较
  const expectedText = checkSpan.innerText.trim();
  const enteredText = wordEntered.trim();

  if (expectedText === enteredText) {
    colorSpan(wordID, 1);
    wordsCorrect++;
    cw.innerText = wordsCorrect;
  } else {
    colorSpan(wordID, 3);
  }

  if (wordNo > 40) {
    displayTest(practiceType);
  } else {
    const nextID = "word " + wordNo;
    colorSpan(nextID, 2);
    
    // 完成一个字符后，如果字符朗读开启，读出下一个字符
    setTimeout(() => {
      if (charSpeakEnabled && soundEnabled) {
        speakCurrentChar();
      }
    }, 200);
  }
}

// 为字符着色
function colorSpan(id, color) {
  const span = document.getElementById(id);
  if (color === 1) {
    span.classList.remove('wrong');
    span.classList.remove('current');
    span.classList.add('correct');
  } else if (color === 2) {
    span.classList.remove('correct');
    span.classList.remove('wrong');
    span.classList.add('current');
  } else {
    span.classList.remove('correct');
    span.classList.remove('current');
    span.classList.add('wrong');
  }
}

// 显示练习内容
function displayTest(type) {
  wordNo = 1;
  testItem.innerHTML = '';

  let newTest = generateContent(type);
  newTest.forEach(function(word, i) {
    let wordSpan = document.createElement('span');
    wordSpan.innerText = word;
    wordSpan.setAttribute("id", "word " + (i + 1));
    testItem.appendChild(wordSpan);
  });

  const nextID = "word " + wordNo;
  colorSpan(nextID, 2);
  
  // 显示新内容后，如果字符朗读开启，读出第一个字符
  setTimeout(() => {
    if (charSpeakEnabled && soundEnabled) {
      speakCurrentChar();
    }
  }, 300);
}

// 生成练习内容
function generateContent(type) {
  var selectedContent = [];
  
  if (type === "singleChar") {
    // 单字符模式：随机生成键盘字符（去除空格）
    for (var i = 0; i < 40; i++) {
      var randomNumber = Math.floor(Math.random() * keyboardChars.length);
      var char = keyboardChars[randomNumber];
      selectedContent.push(char + " ");
    }
  } else {
    // 拼音模式：随机选择拼音内容，每个拼音单独显示
    for (var i = 0; i < 40; i++) {
      var randomNumber = Math.floor(Math.random() * pinyinContent.length);
      selectedContent.push(pinyinContent[randomNumber] + " ");
    }
  }
  
  return selectedContent;
}
