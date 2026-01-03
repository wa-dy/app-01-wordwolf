"use strict";

// ===========================================
// ゲーム状態管理
// ===========================================

const gameState = {
  // ゲーム設定
  totalPlayers: 4, // プレイヤー総数
  timerMinutes: 3, // 制限時間（分）
  gameMode: "tamed", // ゲームモード

  // プレイヤー情報
  players: [], // プレイヤー情報
  master: null, // マスター

  // ゲーム進行
  currentScreen: "setup", // 現在の画面
  currentPlayerIndex: 0, // プレイヤー順次操作画面用
  roundCount: 0, // ラウンド数

  // ワード設定
  wordSets: [], // ワードセット
  villagerWord: "", // 村人ワード
  wolfWord: "", // ウルフワード

  // 配役
  wolfIndex: null, // ウルフのインデックス

  // タイマー
  timer: null, // タイマーのインターバルID
  timeRemaining: 0, // 残り時間
  isTimerPaused: false, // タイマーの一時停止フラグ

  // 投票情報
  accusedPlayer: [], // 最多投票者
  isVoting: false, // 投票中フラグ
  isVoteEnded: false, // 投票終了フラグ

  // ウルフの勝利判定
  isWolfWinner: null, // ウルフの勝利判定フラグ

  // 逆転チャンス
  wolfGuess: "", // ウルフの逆転チャンス予想ワード
};

// ===========================================
//  ワードセット
// ===========================================

// JSONファイルからワードセットを読み込み
async function loadWordSets() {
  try {
    const response = await fetch("/assets/data/wordsets.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    gameState.wordSets = (await response.json()).wordSets;
    console.log("ワードセットを読み込みました:", gameState.wordSets.length, "セット");
  } catch (error) {
    console.error("ワードセットの読み込みに失敗しました:", error);

    // フォールバック用のデフォルトワードセット
    gameState.wordSets = [
      {
        word1: "りんご",
        word2: "みかん",
      },
      {
        word1: "コーヒー",
        word2: "紅茶",
      },
      {
        word1: "猫",
        word2: "犬",
      },
    ];
  }
}

// ===========================================
//  DOM要素の取得
// ===========================================

const elements = {
  // 画面
  page: document.querySelector(".js-page"),
  screens: document.querySelectorAll(".js-screen"),
  setupScreen: document.querySelector(".js-setup"),

  // モーダルウィンドウ
  modalWindowContent: document.querySelector(".js-modal-window-content"),
  modalWindowMask: document.querySelector(".js-modal-window-mask"),
  modalWindowRoundCount: document.querySelector(".js-modal-window-round-count"),

  // ヘルプ画面
  helpModalContent: document.querySelector(".js-help-modal-content"),
  helpModalBody: document.querySelector(".js-help-modal-body"),
  helpModalShowButton: document.querySelector(".js-help-modal-show-button"),
  helpModalCloseButton: document.querySelector(".js-help-modal-close-button"),

  // トップページ
  topStartButton: document.querySelector(".js-top-start-button"),
  topContinueButton: document.querySelector(".js-top-continue-button"),

  // 設定画面
  setupTamedMode: document.querySelector(".js-setup-tamed-mode"),
  setupWildMode: document.querySelector(".js-setup-wild-mode"),
  setupModeSelectorLabel: document.querySelectorAll(".js-setup-mode-selector-label"),
  setupTotalPlayers: document.querySelector(".js-setup-total-players"),
  setupTotalPlayersText: document.querySelector(".js-setup-total-players-text"),
  setupPlayersList: document.querySelector(".js-setup-players-list"),
  setupTimerMinutes: document.querySelector(".js-setup-timer-minutes"),
  setupStartButton: document.querySelector(".js-setup-start-button"),

  // ワードセット画面（家畜モード）
  wordSetMasterPlayer: document.querySelector(".js-word-set-master-player"),
  wordSetVillagerWord: document.querySelector(".js-word-set-villager-word"),
  wordSetWolfWord: document.querySelector(".js-word-set-wolf-word"),
  wordSetErrorText: document.querySelector(".js-word-set-error-text"),
  wordSetSwapWordsButton: document.querySelector(".js-word-set-swap-words-button"),
  wordSetSubmitButton: document.querySelector(".js-word-set-submit-button"),

  // ワード配布画面
  wordDistributionCurrentPlayer: document.querySelector(".js-word-distribution-current-player"),
  wordDistributionCurrentText: document.querySelector(".js-word-distribution-current-text"),
  wordDistributionRevealButton: document.querySelector(".js-word-distribution-reveal-button"),
  wordDistributionModalContent: document.querySelector(".js-word-distribution-modal-content"),
  wordDistributionModalBody: document.querySelector(".js-word-distribution-modal-body"),
  wordDistributionModalPlayer: document.querySelector(".js-word-distribution-modal-player"),
  wordDistributionModalWord: document.querySelector(".js-word-distribution-modal-word"),
  wordDistributionNextButton: document.querySelector(".js-word-distribution-next-button"),
  wordDistributionShowDiscussionButton: document.querySelector(".js-word-distribution-show-discussion-button"),

  // 討論画面
  discussionTimer: document.querySelector(".js-discussion-timer"),
  discussionTimerStartButton: document.querySelector(".js-discussion-timer-start-button"),
  discussionTimerPauseButton: document.querySelector(".js-discussion-timer-pause-button"),
  discussionTimerResumeButton: document.querySelector(".js-discussion-timer-resume-button"),
  discussionEndButton: document.querySelector(".js-discussion-end-button"),
  discussionTimerSound: document.querySelector(".js-discussion-timer-sound"),
  discussionMasterPlayer: document.querySelector(".js-discussion-master-player"),
  discussionPlayersList: document.querySelector(".js-discussion-players-list"),

  // 投票画面
  voteStartButton: document.querySelector(".js-vote-start-button"),
  voteResultButton: document.querySelector(".js-vote-result-button"),
  voteContinueDiscussionButton: document.querySelector(".js-vote-continue-discussion-button"),
  voteModalContent: document.querySelector(".js-vote-modal-content"),
  voteModalBody: document.querySelector(".js-vote-modal-body"),
  voteModalPlayer: document.querySelector(".js-vote-modal-player"),
  voteModalOptions: document.querySelector(".js-vote-modal-options"),
  voteModalSubmitButton: document.querySelector(".js-vote-modal-submit-button"),

  // 投票結果画面
  voteResultAccusedPlayer: document.querySelector(".js-vote-result-accused-player"),
  voteResultPanelSuccess: document.querySelector(".js-vote-result-panel-success"),
  voteResultPanelFailure: document.querySelector(".js-vote-result-panel-failure"),
  voteResultWolfPlayer: document.querySelectorAll(".js-vote-result-wolf-player"),
  voteResultHistoryList: document.querySelector(".js-vote-result-history-list"),
  voteResultWolfChanceButton: document.querySelector(".js-vote-result-wolf-chance-button"),
  voteResultRoundResultButton: document.querySelector(".js-vote-result-round-result-button"),

  // 逆転チャンス画面
  wolfChanceGuess: document.querySelector(".js-wolf-chance-guess"),
  wolfChanceSubmitButton: document.querySelector(".js-wolf-chance-submit-button"),

  // 逆転チャンス結果画面
  wolfChanceResultDisplay: document.querySelector(".js-wolf-chance-result-display"),
  wolfChanceResultPanelSuccess: document.querySelector(".js-wolf-chance-result-panel-success"),
  wolfChanceResultPanelFailure: document.querySelector(".js-wolf-chance-result-panel-failure"),
  wolfChanceResultVillagerWord: document.querySelectorAll(".js-wolf-chance-result-villager-word"),
  wolfChanceResultRoundResultButton: document.querySelector(".js-wolf-chance-result-round-result-button"),
  wolfChanceResultModifyButton: document.querySelector(".js-wolf-chance-result-modify-button"),

  // ラウンド結果画面
  roundResultTitle: document.querySelector(".js-round-result-title"),
  roundResultPanelSuccess: document.querySelector(".js-round-result-panel-success"),
  roundResultPanelFailure: document.querySelector(".js-round-result-panel-failure"),
  roundResultScoreList: document.querySelector(".js-round-result-score-list"),
  roundResultNextRoundButton: document.querySelector(".js-round-result-next-round-button"),
  roundResultGameResultButton: document.querySelector(".js-round-result-game-result-button"),

  // 最終結果画面
  gameResultScoreList: document.querySelector(".js-game-result-score-list"),
  gameResultTopButton: document.querySelector(".js-game-result-top-button"),
};

// ===========================================
//  初期化
// ===========================================

async function init() {
  await loadWordSets();
  setupEventListeners();
  setupTopPage();
}

// ===========================================
//  イベントリスナーの設定
// ===========================================

function setupEventListeners() {
  // ヘルプ画面
  elements.helpModalShowButton.addEventListener("click", showHelpScreenModal);
  elements.helpModalCloseButton.addEventListener("click", closeHelpScreenModal);
  elements.modalWindowMask.addEventListener("click", maskClickToCloseHelp);

  // トップページ
  elements.topStartButton.addEventListener("click", startGame);
  elements.topContinueButton.addEventListener("click", continueGame);

  // 設定画面
  elements.setupTotalPlayers.addEventListener("change", (e) => {
    validateNumberInput(e);
    updatePlayerNameInputs();
  });
  elements.setupTimerMinutes.addEventListener("change", (e) => {
    validateNumberInput(e);
  });
  elements.setupTamedMode.addEventListener("change", (e) => {
    updateGameMode(e);
  });
  elements.setupWildMode.addEventListener("change", (e) => {
    updateGameMode(e);
  });
  elements.setupStartButton.addEventListener("click", registerGameSettings);

  // ワードセット画面
  elements.wordSetVillagerWord.addEventListener("input", validateWordInput);
  elements.wordSetWolfWord.addEventListener("input", validateWordInput);
  elements.wordSetSwapWordsButton.addEventListener("click", wordSetSwap);
  elements.wordSetSubmitButton.addEventListener("click", settingTamedModeWords);

  // ワード配布画面
  elements.wordDistributionRevealButton.addEventListener("click", showWordModal);
  elements.wordDistributionNextButton.addEventListener("click", nextPlayer);
  elements.wordDistributionShowDiscussionButton.addEventListener("click", nextDiscussion);

  // 討論画面
  elements.discussionTimerStartButton.addEventListener("click", startDiscussion);
  elements.discussionTimerPauseButton.addEventListener("click", pauseTimer);
  elements.discussionTimerResumeButton.addEventListener("click", resumeTimer);
  elements.discussionEndButton.addEventListener("click", endDiscussion);

  // 投票画面
  elements.voteStartButton.addEventListener("click", startVote);
  elements.voteContinueDiscussionButton.addEventListener("click", showDiscussionScreen);
  elements.voteModalSubmitButton.addEventListener("click", submitVote);
  elements.voteResultButton.addEventListener("click", isWolfAccused);

  // 投票結果画面
  elements.voteResultWolfChanceButton.addEventListener("click", showWolfChanceScreen);
  elements.voteResultRoundResultButton.addEventListener("click", calculateScore);

  // 逆転チャンス画面
  elements.wolfChanceGuess.addEventListener("input", validateGuessInput);
  elements.wolfChanceSubmitButton.addEventListener("click", submitWolfGuess);

  // 逆転チャンス結果画面
  elements.wolfChanceResultRoundResultButton.addEventListener("click", calculateScore);
  elements.wolfChanceResultModifyButton.addEventListener("click", modifyWolfGuessResult);

  // ゲーム結果画面
  elements.roundResultNextRoundButton.addEventListener("click", handleModeSwitch);
  elements.roundResultGameResultButton.addEventListener("click", showGameResultScreen);

  // 最終結果画面
  elements.gameResultTopButton.addEventListener("click", endGame);
}

// ===========================================
//  画面表示
// ===========================================

function showScreen(screenName) {
  // すべての画面を非表示
  elements.screens.forEach((screen) => {
    screen.classList.remove("is-active");
  });

  // 指定された画面を表示
  document.querySelector(`.js-${screenName}`).classList.add("is-active");

  window.scrollTo(0, 0);
  gameState.currentScreen = screenName;
}

// ===========================================
//  トップページ
// ===========================================

// トップページのセットアップ
function setupTopPage() {
  // ゲーム状態が保存されていれば、続きからボタンを表示
  if (localStorage.getItem("wordWolfGameState")) {
    elements.topContinueButton.disabled = false;
  } else {
    elements.topContinueButton.disabled = true;
  }
}

function startGame() {
  initGameState();
  showSetupScreen();
}

function continueGame() {
  loadGameState();
  showScreen(gameState.currentScreen);
}

// ===========================================
//  ヘルプ画面
// ===========================================

// ヘルプ画面を表示
function showHelpScreenModal() {
  elements.modalWindowContent.append(elements.helpModalBody);
  elements.page.classList.add("is-help");
}

// ヘルプ画面を閉じる
function closeHelpScreenModal() {
  elements.helpModalContent.append(elements.helpModalBody);
  elements.page.classList.remove("is-help");
}

// ヘルプ画面のマスクをクリックしたら閉じる
function maskClickToCloseHelp() {
  elements.helpModalCloseButton.click();
}

// ===========================================
//  ゲーム設定画面
// ===========================================

// ゲーム設定画面を表示
function showSetupScreen() {
  showScreen("setup");
  updatePlayerNameInputs();
}

// プレイヤー名入力フィールド数の更新
function updatePlayerNameInputs() {
  const totalPlayers = parseInt(elements.setupTotalPlayers.value);

  // 既存の入力値を保持
  const existingValues = [];
  const inputs = elements.setupPlayersList.querySelectorAll(".js-setup-player-name-input");
  inputs.forEach((input) => {
    existingValues.push(input.value);
  });

  // 既存の入力フィールドをクリア
  elements.setupPlayersList.innerHTML = "";

  // 新しい入力フィールドを作成
  for (let i = 0; i < totalPlayers; i++) {
    const wrapperDiv = document.createElement("div");

    const label = document.createElement("label");
    label.htmlFor = `player-name-${i + 1}`;
    label.textContent = `プレイヤー${i + 1}:`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "c-form-input js-setup-player-name-input";
    input.placeholder = "5文字以内で入力してください";
    input.id = label.htmlFor;
    input.maxLength = 5;

    // 既存フォームに入力がある場合引き継ぐ
    if (existingValues[i]) {
      input.value = existingValues[i];
    }

    wrapperDiv.appendChild(label);
    wrapperDiv.appendChild(input);
    elements.setupPlayersList.appendChild(wrapperDiv);
  }
}

// ゲームモード選択
function updateGameMode(e) {
  gameState.gameMode = e.target.value;
  elements.setupModeSelectorLabel.forEach((label) => {
    label.classList.remove("is-active");
  });
  e.target.labels[0].classList.add("is-active");
  if (gameState.gameMode === "tamed") {
    elements.setupScreen.classList.add(`is-tamed`);
    elements.setupScreen.classList.remove(`is-wild`);
  } else if (gameState.gameMode === "wild") {
    elements.setupScreen.classList.remove(`is-tamed`);
    elements.setupScreen.classList.add(`is-wild`);
  }
  validatePlayerCountByMode();
}

// プレイ人数のバリデーション
function validatePlayerCountByMode() {
  if (gameState.gameMode === "tamed") {
    elements.setupTotalPlayers.min = 4;
    elements.setupTotalPlayers.max = 8;
  } else if (gameState.gameMode === "wild") {
    elements.setupTotalPlayers.min = 3;
    elements.setupTotalPlayers.max = 7;
  }
  elements.setupTotalPlayersText.textContent = `プレイ人数：${elements.setupTotalPlayers.min}～${elements.setupTotalPlayers.max}人`;
  elements.setupTotalPlayers.dispatchEvent(new Event("change", { bubbles: true }));
}

// 数値入力のバリデーション
function validateNumberInput(e) {
  const input = e.target; // イベントの対象要素（input）
  const min = parseInt(input.min, 10); // inputのmin属性を取得
  const max = parseInt(input.max, 10); // inputのmax属性を取得
  let value = parseInt(input.value, 10); // inputのvalue属性を取得

  if (isNaN(value)) {
    // 数値でない場合はボタンを無効化
    elements.setupStartButton.disabled = true;
    return;
  } else {
    // 数値である場合はボタンを有効化
    elements.setupStartButton.disabled = false;
  }

  if (value < min) input.value = min; // 最小値未満の場合は最小値にする
  if (value > max) input.value = max; // 最大値より大きい場合は最大値にする
}

// ゲーム設定情報を登録
function registerGameSettings() {
  gameState.totalPlayers = parseInt(elements.setupTotalPlayers.value);
  gameState.timerMinutes = parseInt(elements.setupTimerMinutes.value);

  // プレイヤー情報を収集
  const playerNameInputs = elements.setupPlayersList.querySelectorAll(".js-setup-player-name-input");
  gameState.players = []; // 一旦クリア

  // プレイヤー情報を登録
  playerNameInputs.forEach((input, index) => {
    const name = input.value.trim() || `プレイヤー${index + 1}`;
    gameState.players.push({
      index: index,
      name: name,
      word: "",
      votedIndex: null, // 投票対象のインデックス
      votesReceived: 0, // 投票された数
      score: 0,
      wolfCount: 0, // ウルフになった回数
    });
  });

  // ワード配布画面への遷移
  gameState.roundCount = 0;
  handleModeSwitch();
}

// モードによる分岐
function handleModeSwitch() {
  if (gameState.gameMode === "tamed") {
    initWordSetScreen();
  } else if (gameState.gameMode === "wild") {
    settingWildModeWords();
    startRound();
  }
}

// 野生モードのワード設定
function settingWildModeWords() {
  // ランダムにワードセットを選択し、どちらをウルフワードにするかもランダムに決定
  const selectedWordSet = gameState.wordSets[Math.floor(Math.random() * gameState.wordSets.length)];
  const isFirstWordWolf = Math.random() < 0.5; // 50%の確率で最初のワードをウルフワードにする

  if (isFirstWordWolf) {
    gameState.villagerWord = selectedWordSet.word2;
    gameState.wolfWord = selectedWordSet.word1;
  } else {
    gameState.villagerWord = selectedWordSet.word1;
    gameState.wolfWord = selectedWordSet.word2;
  }
}

// ===========================================
//  ワードセット画面（家畜モード）
// ===========================================

// ワードセット画面の初期化
function initWordSetScreen() {
  assignMaster();
  showWordSetScreen();
}

// ワードセット画面を表示
function showWordSetScreen() {
  showScreen("word-set");
  setupWordSetScreen();
}

// ワードセット画面のUIを設定
function setupWordSetScreen() {
  elements.wordSetMasterPlayer.textContent = `マスターは${gameState.master.name}です`;
  elements.wordSetVillagerWord.value = "";
  elements.wordSetWolfWord.value = "";
  elements.wordSetSubmitButton.disabled = true;

  saveGameState();
}

// マスターを選出
function assignMaster() {
  // マスターがいる場合はプレイヤー末尾に戻す
  if (gameState.master) {
    gameState.players.push(gameState.master);
  }
  // 先頭プレイヤーをマスターにする
  gameState.master = gameState.players.shift();

  // 全員のインデックスを再設定
  gameState.master.index = null;
  gameState.players.forEach((players, index) => {
    players.index = index;
  });
}

// ワード入力のバリデーション
function validateWordInput() {
  const villager = elements.wordSetVillagerWord.value.trim();
  const wolf = elements.wordSetWolfWord.value.trim();

  if (!villager || !wolf) {
    elements.wordSetSubmitButton.disabled = true;
    elements.wordSetErrorText.classList.remove("is-active");
    return;
  }

  if (villager === wolf) {
    elements.wordSetErrorText.classList.add("is-active");
    elements.wordSetSubmitButton.disabled = true;
    return;
  }

  elements.wordSetErrorText.classList.remove("is-active");
  elements.wordSetSubmitButton.disabled = false;
}

// ワード入力のスワップ
function wordSetSwap() {
  const toWolfWord = elements.wordSetVillagerWord.value;
  const toVillagerWord = elements.wordSetWolfWord.value;
  elements.wordSetVillagerWord.value = toVillagerWord;
  elements.wordSetWolfWord.value = toWolfWord;
}

// ワードセットの設定
function settingTamedModeWords() {
  gameState.villagerWord = elements.wordSetVillagerWord.value.trim();
  gameState.wolfWord = elements.wordSetWolfWord.value.trim();

  startRound();
}

// ===========================================
//  ラウンドセット
// ===========================================

// ラウンド開始
function startRound() {
  gameState.roundCount++;
  assignWolfAndWords();

  gameState.currentPlayerIndex = 0;
  showWordDistributionScreen();
  roundCountAnimation();
}

// ウルフとワードを決定
function assignWolfAndWords() {
  // ウルフのインデックスを決定
  gameState.wolfIndex = Math.floor(Math.random() * gameState.players.length);
  gameState.players[gameState.wolfIndex].wolfCount++;

  // プレイヤーにワードを配布
  gameState.players.forEach((player) => {
    player.word = player.index === gameState.wolfIndex ? gameState.wolfWord : gameState.villagerWord;
  });
}

// ラウンドカウントのアニメーション
function roundCountAnimation() {
  elements.modalWindowRoundCount.textContent = `Round ${gameState.roundCount}`;
  elements.page.classList.add("is-round-count");

  setTimeout(() => {
    elements.page.classList.remove("is-round-count");
  }, 2000);
}

// ===========================================
//  ワード配布画面
// ===========================================

// ワード配布画面を表示
function showWordDistributionScreen() {
  showScreen("word-distribution");
  setupWordDistributionScreen();
}

// ワード配布画面のUIを設定
function setupWordDistributionScreen() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  elements.wordDistributionCurrentPlayer.textContent = `${currentPlayer.name}のワード`;
  elements.wordDistributionCurrentText.textContent = `${currentPlayer.name}だけ確認してください`;

  saveGameState();
}

// ワードモーダルを表示
function showWordModal() {
  setupWordModalContent();
  elements.page.classList.add("is-modal");
}

// ワードモーダル画面のUIを設定
function setupWordModalContent() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  elements.wordDistributionModalPlayer.textContent = `${currentPlayer.name}のワード`;
  elements.wordDistributionModalWord.textContent = currentPlayer.word;
  if (gameState.currentPlayerIndex !== gameState.players.length - 1) {
    elements.wordDistributionNextButton.style.display = "inline-block";
    elements.wordDistributionShowDiscussionButton.style.display = "none";
  } else {
    elements.wordDistributionNextButton.style.display = "none";
    elements.wordDistributionShowDiscussionButton.style.display = "inline-block";
  }
  elements.modalWindowContent.append(elements.wordDistributionModalBody);
}

// ワードモーダルを閉じる
function closeWordModal() {
  elements.wordDistributionModalContent.append(elements.wordDistributionModalBody);
  elements.page.classList.remove("is-modal");
}

// 次のプレイヤーへ
function nextPlayer() {
  gameState.currentPlayerIndex++;
  closeWordModal();
  setupWordDistributionScreen();
}

function nextDiscussion() {
  gameState.currentPlayerIndex = 0;
  closeWordModal();
  showDiscussionScreen();
}

// ===========================================
//  討論画面
// ===========================================

// 討論画面を表示
function showDiscussionScreen() {
  showScreen("discussion");
  setupDiscussionScreen();
}

// 討論画面のUIを設定
function setupDiscussionScreen() {
  createPlayersList();
  gameState.timeRemaining = gameState.timerMinutes * 60;
  gameState.isTimerPaused = false;

  // 討論開始ボタンを表示、タイマーコントロールは非表示
  elements.discussionTimer.textContent = `${gameState.timerMinutes.toString().padStart(2, "0")}:00`;
  elements.discussionTimerStartButton.style.display = "inline-block";
  elements.discussionTimerPauseButton.style.display = "none";
  elements.discussionTimerResumeButton.style.display = "none";
  elements.discussionEndButton.style.display = "none";

  saveGameState();
}

// プレイヤー一覧を作成
function createPlayersList() {
  const playersList = elements.discussionPlayersList;
  if (gameState.gameMode === "tamed") {
    elements.discussionMasterPlayer.textContent = `マスター：${gameState.master.name}`;
  }
  playersList.innerHTML = "";

  gameState.players.forEach((player) => {
    const listItem = document.createElement("li");
    listItem.className = "p-discussion__player-item";

    const headerDiv = document.createElement("div");
    headerDiv.className = "p-discussion__player-item-header";

    const nameSpan = document.createElement("span");
    nameSpan.className = "p-discussion__player-item-name";
    nameSpan.textContent = player.name;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "p-discussion__player-item-score";
    scoreSpan.textContent = `${player.score}点`;

    const wordDiv = document.createElement("div");
    wordDiv.className = "p-discussion__player-item-word js-discussion-player-word";

    const wordSpan = document.createElement("span");
    wordSpan.className = "p-discussion__player-item-word-text";
    wordSpan.textContent = `${player.word}`;

    headerDiv.appendChild(nameSpan);
    headerDiv.appendChild(scoreSpan);
    wordDiv.appendChild(wordSpan);
    listItem.appendChild(headerDiv);
    listItem.appendChild(wordDiv);

    // クリックでワード表示/非表示
    listItem.addEventListener("click", () => {
      const isOpen = wordDiv.classList.contains("is-active");
      document.querySelectorAll(".js-discussion-player-word").forEach((word) => {
        word.style.height = "0px";
        word.classList.remove("is-active");
      });
      // 既に開いていなければ開く（トグル動作）
      if (!isOpen) {
        wordDiv.style.height = wordDiv.scrollHeight + "px";
        wordDiv.classList.add("is-active");
      }
    });
    playersList.appendChild(listItem);
  });
}

// 討論開始（タイマー開始とUI切り替え）
function startDiscussion() {
  elements.discussionTimerStartButton.style.display = "none";
  elements.discussionTimerPauseButton.style.display = "inline-block";
  elements.discussionEndButton.style.display = "inline-block";
  startTimer();
}

// 討論終了
function endDiscussion() {
  if (confirm("討論を終了して投票に進みますか？")) {
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }

    initVote();
  }
}

// ===========================================
//  タイマー
// ===========================================

// タイマー開始
function startTimer() {
  setupAudio();

  if (gameState.timer) {
    clearInterval(gameState.timer);
  }

  gameState.timer = setInterval(() => {
    if (!gameState.isTimerPaused) {
      gameState.timeRemaining--;
      updateTimerDisplay();

      if (gameState.timeRemaining <= 0) {
        clearInterval(gameState.timer);
        timerEnd();
      }
    }
  }, 1000);

  updateTimerDisplay();
}

// オーディオの準備
async function setupAudio() {
  try {
    elements.discussionTimerSound.muted = true; // playからpause間の音出しを防ぐ
    await elements.discussionTimerSound.play(); // ブラウザからの許可待ち
    elements.discussionTimerSound.pause(); // 再生後、即停止
    elements.discussionTimerSound.currentTime = 0; // 再生位置を最初に戻す
    elements.discussionTimerSound.muted = false; // ミュートを外して再生準備
  } catch (e) {
    console.warn("オーディオの読み込みに失敗：", e);
  }
}

// タイマー表示更新
function updateTimerDisplay() {
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = gameState.timeRemaining % 60;
  elements.discussionTimer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// タイマー一時停止
function pauseTimer() {
  gameState.isTimerPaused = true;
  elements.discussionTimerPauseButton.style.display = "none";
  elements.discussionTimerResumeButton.style.display = "inline-block";
}

// タイマー再開
function resumeTimer() {
  gameState.isTimerPaused = false;
  elements.discussionTimerPauseButton.style.display = "inline-block";
  elements.discussionTimerResumeButton.style.display = "none";
}

// タイマー終了
function timerEnd() {
  playTimerSound();

  // 投票画面に移動
  initVote();
}

// タイマー終了時のオーディオ再生
function playTimerSound() {
  elements.discussionTimerSound.play();
}

// ===========================================
//  投票画面
// ===========================================

// 投票情報初期化（討論画面からの遷移のみ動作）
function initVote() {
  gameState.currentPlayerIndex = 0;
  gameState.isVoting = false;
  gameState.isVoteEnded = false;

  // 投票数を0で初期化
  gameState.players.forEach((player) => {
    player.votesReceived = 0;
  });

  showVoteScreen();
}

// 投票開始画面の表示
function showVoteScreen() {
  showScreen("vote");
  setupVoteScreen();
}

// 投票画面のUIを設定
function setupVoteScreen() {
  if (!gameState.isVoting) {
    elements.voteStartButton.disabled = false;
    elements.voteContinueDiscussionButton.disabled = false;
    elements.voteResultButton.disabled = false;
  } else {
    elements.voteStartButton.disabled = true;
    elements.voteContinueDiscussionButton.disabled = true;
    elements.voteResultButton.disabled = true;
  }

  if (!gameState.isVoteEnded) {
    elements.voteStartButton.style.display = "inline-block";
    elements.voteContinueDiscussionButton.style.display = "inline-block";
    elements.voteResultButton.style.display = "none";
  } else {
    elements.voteStartButton.style.display = "none";
    elements.voteContinueDiscussionButton.style.display = "none";
    elements.voteResultButton.style.display = "inline-block";
  }

  setupVoteModalContent();

  // 投票中の場合はモーダルを表示
  if (gameState.isVoting) {
    elements.page.classList.add("is-modal");
    elements.modalWindowContent.append(elements.voteModalBody);
  } else {
    elements.page.classList.remove("is-modal");
    elements.voteModalContent.append(elements.voteModalBody);
  }

  saveGameState();
}

// 投票開始
function startVote() {
  gameState.isVoting = true;
  setupVoteScreen();
}

// 投票モーダル画面のUIを設定
function setupVoteModalContent() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  elements.voteModalPlayer.textContent = `${currentPlayer.name}の投票`;
  createVoteOptions();
  elements.voteModalSubmitButton.disabled = true;
}

// 投票オプション生成
function createVoteOptions() {
  elements.voteModalOptions.innerHTML = "";
  gameState.players.forEach((player) => {
    if (player.index === gameState.currentPlayerIndex) return; // 自分以外
    const optionItem = document.createElement("li");
    optionItem.className = "p-vote__option-item js-vote-option-item";
    optionItem.textContent = player.name;
    optionItem.dataset.playerIndex = player.index;
    optionItem.addEventListener("click", () => {
      selectVoteOption(optionItem, player.index);
    });
    elements.voteModalOptions.appendChild(optionItem);
  });
}

// 投票オプション選択
function selectVoteOption(optionItem, playerIndex) {
  // すでに選択されているオプションを選択した場合は選択解除
  if (optionItem.classList.contains("is-active")) {
    optionItem.classList.remove("is-active");
    elements.voteModalSubmitButton.disabled = true;
    gameState.players[gameState.currentPlayerIndex].votedIndex = null;
  } else {
    document.querySelectorAll(".js-vote-option-item").forEach((item) => {
      item.classList.remove("is-active");
    });
    optionItem.classList.add("is-active");
    elements.voteModalSubmitButton.disabled = false;
    gameState.players[gameState.currentPlayerIndex].votedIndex = playerIndex; // 選択indexを保持
  }
}

// 投票ボタン押下
function submitVote() {
  const selectedIndex = gameState.players[gameState.currentPlayerIndex].votedIndex;
  gameState.players[selectedIndex].votesReceived++;

  // 次のプレイヤーへ
  if (gameState.currentPlayerIndex !== gameState.players.length - 1) {
    showVoteNextModalAnimation();
  } else {
    endVote();
  }
}

// 次のプレイヤーへのモーダルアニメーション
function showVoteNextModalAnimation() {
  elements.page.classList.remove("is-modal");
  setTimeout(() => {
    gameState.currentPlayerIndex++;
    setupVoteScreen();
  }, 500);
}

// 投票終了
function endVote() {
  gameState.isVoting = false;
  gameState.isVoteEnded = true;
  setupVoteScreen();
}

// 投票数をカウントし、ウルフの指名判定を行う
function isWolfAccused() {
  gameState.accusedPlayer = [];

  // 最多得票者を特定
  const maxVotes = Math.max(...gameState.players.map((player) => player.votesReceived));
  gameState.accusedPlayer = gameState.players.filter((player) => player.votesReceived === maxVotes);

  // 最多得票者が1人の場合
  if (gameState.accusedPlayer.length === 1) {
    // ウルフの指名判定
    if (gameState.accusedPlayer[0].index === gameState.wolfIndex) {
      gameState.isWolfWinner = false; // ウルフが指名された場合
    } else {
      gameState.isWolfWinner = true; // ウルフが指名されなかった場合
    }
  } else {
    gameState.isWolfWinner = true; // 票が割れた場合はウルフの勝利
  }

  showVoteResultScreen();
}

// ===========================================
//  投票結果画面
// ===========================================

// 投票結果画面の表示
function showVoteResultScreen() {
  showScreen("vote-result");
  setupVoteResultScreen();
}

// 投票結果画面のUIを設定
function setupVoteResultScreen() {
  // 名前表示
  if (gameState.accusedPlayer.length === 1) {
    elements.voteResultAccusedPlayer.textContent = `${gameState.accusedPlayer[0].name}が選ばれました`;
  } else {
    elements.voteResultAccusedPlayer.textContent = "投票が割れました";
  }

  // 結果表示の切り替え
  if (gameState.isWolfWinner) {
    elements.voteResultPanelSuccess.style.display = "none";
    elements.voteResultPanelFailure.style.display = "block";
    elements.voteResultWolfChanceButton.style.display = "none";
    elements.voteResultRoundResultButton.style.display = "inline-block";
  } else {
    elements.voteResultPanelSuccess.style.display = "block";
    elements.voteResultPanelFailure.style.display = "none";
    elements.voteResultWolfChanceButton.style.display = "inline-block";
    elements.voteResultRoundResultButton.style.display = "none";
  }

  elements.voteResultWolfPlayer.forEach((player) => {
    player.textContent = `${gameState.players[gameState.wolfIndex].name}がウルフでした`;
  });

  createVoteHistory();

  saveGameState();
}

// 投票履歴を作成
function createVoteHistory() {
  elements.voteResultHistoryList.innerHTML = "";

  gameState.players.forEach((player) => {
    const itemDiv = document.createElement("li");
    itemDiv.className = "p-vote-result__history-item";

    const playerSpan = document.createElement("span");
    playerSpan.className = "p-vote-result__history-player";
    playerSpan.textContent = player.name;

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "p-vote-result__history-arrow";
    arrowSpan.innerHTML = "&#10140;";

    const votedPlayerSpan = document.createElement("span");
    votedPlayerSpan.className = "p-vote-result__history-player";
    votedPlayerSpan.textContent = gameState.players[player.votedIndex].name;

    itemDiv.appendChild(playerSpan);
    itemDiv.appendChild(arrowSpan);
    itemDiv.appendChild(votedPlayerSpan);
    elements.voteResultHistoryList.appendChild(itemDiv);
  });
}

// ===========================================
//  逆転チャンス画面
// ===========================================

// 逆転チャンス画面の表示
function showWolfChanceScreen() {
  showScreen("wolf-chance");
  setupWolfChanceScreen();
}

// 逆転チャンス画面のUIを設定
function setupWolfChanceScreen() {
  elements.wolfChanceGuess.value = "";

  saveGameState();
}

// 逆転チャンス入力のバリデーション
function validateGuessInput() {
  elements.wolfChanceSubmitButton.disabled = !elements.wolfChanceGuess.value.trim();
}

// ウルフの推測提出
function submitWolfGuess() {
  gameState.wolfGuess = elements.wolfChanceGuess.value.trim();
  gameState.isWolfWinner = gameState.wolfGuess === gameState.villagerWord; // 成否判定

  showWolfChanceResultScreen();
}

// ===========================================
//  逆転チャンス結果画面
// ===========================================

// 逆転チャンス結果画面の表示
function showWolfChanceResultScreen() {
  showScreen("wolf-chance-result");
  setupWolfChanceResultScreen();
}

// 逆転チャンス結果画面のUIを設定
function setupWolfChanceResultScreen() {
  elements.wolfChanceResultDisplay.innerHTML = `ウルフの推測<br>「${gameState.wolfGuess}」`;
  if (gameState.isWolfWinner) {
    elements.wolfChanceResultPanelSuccess.style.display = "block";
    elements.wolfChanceResultPanelFailure.style.display = "none";
  } else {
    elements.wolfChanceResultPanelSuccess.style.display = "none";
    elements.wolfChanceResultPanelFailure.style.display = "block";
  }

  elements.wolfChanceResultVillagerWord.forEach((word) => {
    word.textContent = `村人のワードは${gameState.villagerWord}でした`;
  });

  saveGameState();
}

// 逆転チャンス結果の修正
function modifyWolfGuessResult() {
  gameState.isWolfWinner = !gameState.isWolfWinner;

  showWolfChanceResultScreen();
}

// ===========================================
//  配点計算
// ===========================================

// 投票結果による配点計算
function calculateScore() {
  if (gameState.isWolfWinner) {
    // ウルフの勝利
    gameState.players[gameState.wolfIndex].score++;
  } else if (!gameState.isWolfWinner) {
    // 村人の勝利の場合
    gameState.players.forEach((player) => {
      if (player.index !== gameState.wolfIndex) {
        // 村人の場合
        if (player.votedIndex === gameState.wolfIndex) {
          // ウルフに投票していた場合
          player.score++;
        }
      }
    });
  }

  showRoundResult();
}

// ===========================================
//  ラウンド結果画面
// ===========================================

// ラウンド結果画面を表示
function showRoundResult() {
  showScreen("round-result");
  setupRoundResultScreen();
}

// ラウンド結果画面のUIを設定
function setupRoundResultScreen() {
  elements.roundResultTitle.innerHTML = `ゲーム結果：Round ${gameState.roundCount}`;
  if (gameState.isWolfWinner) {
    elements.roundResultPanelFailure.style.display = "block";
    elements.roundResultPanelSuccess.style.display = "none";
  } else if (!gameState.isWolfWinner) {
    elements.roundResultPanelSuccess.style.display = "block";
    elements.roundResultPanelFailure.style.display = "none";
  }
  // スコアボード表示
  showRoundScoreBoard();

  saveGameState();
}

// スコアボード表示
function showRoundScoreBoard() {
  // マスターとプレイヤーを合流
  playerMarge();
  // スコアでソート
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  elements.roundResultScoreList.innerHTML = "";
  sortedPlayers.forEach((player) => {
    const listItem = document.createElement("li");
    listItem.className = "p-round-result__score-item";

    const playerDiv = document.createElement("div");
    playerDiv.className = "p-round-result__score-player";

    const playerSpan = document.createElement("span");
    playerSpan.textContent = `${player.name}`;

    const scoreSpan = document.createElement("span");
    scoreSpan.textContent = `${player.score}点`;

    playerDiv.appendChild(playerSpan);
    playerDiv.appendChild(scoreSpan);
    listItem.appendChild(playerDiv);

    const wordDiv = document.createElement("div");
    if (player.index !== null) {
      if (player.index === gameState.wolfIndex) {
        wordDiv.className = "p-round-result__score-word p-round-result__score-word--wolf";
      } else {
        wordDiv.className = "p-round-result__score-word p-round-result__score-word--villager";
      }
      wordDiv.textContent = `${player.word}`;
      addRoundScoreIcon(player, listItem);
    } else {
      wordDiv.className = "p-round-result__score-word p-round-result__score-word--master";
      wordDiv.textContent = "ゲームマスター";
    }

    listItem.appendChild(wordDiv);
    elements.roundResultScoreList.appendChild(listItem);
  });
}

// マスターとプレイヤーを合流
function playerMarge() {
  // マスターがいる場合はプレイヤー末尾に戻す
  if (gameState.master) {
    gameState.players.push(gameState.master);
    gameState.master = null;
  }
}

// スコアアイコンの追加
function addRoundScoreIcon(player, listItem) {
  const winSpan = document.createElement("span");
  winSpan.className = "p-round-result__score-win-icon";
  winSpan.textContent = `WIN`;

  if (gameState.isWolfWinner) {
    if (player.index === gameState.wolfIndex) {
      // ウルフが勝利かつ自身がウルフの場合
      listItem.appendChild(winSpan);
    }
  } else {
    if (player.index !== gameState.wolfIndex) {
      if (player.votedIndex === gameState.wolfIndex) {
        // ウルフが敗北かつ自身が村人かつウルフに投票していた場合
        listItem.appendChild(winSpan);
      }
    }
  }
}

// ===========================================
//  最終結果画面
// ===========================================

// 最終結果画面を表示
function showGameResultScreen() {
  showScreen("game-result");
  setupGameResultScreen();
}

// 最終結果画面のUIを設定
function setupGameResultScreen() {
  // トータルスコアボード表示
  showGameScoreBoard();

  saveGameState();
}

// トータルスコアボード表示
function showGameScoreBoard() {
  // 最大スコアを取得
  const maxScore = Math.max(...gameState.players.map((player) => player.score));
  // スコアでソート
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  elements.gameResultScoreList.innerHTML = "";
  sortedPlayers.forEach((player) => {
    const listItem = document.createElement("li");
    listItem.className = "p-game-result__score-item";

    const playerSpan = document.createElement("span");
    playerSpan.textContent = `${player.name} (ウルフ: ${player.wolfCount}回)`;

    const scoreSpan = document.createElement("span");
    scoreSpan.textContent = `${player.score}点`;

    // 勝者マーク表示
    if (player.score === maxScore) {
      const winnerSpan = document.createElement("span");
      winnerSpan.className = "p-game-result__score-trophy-icon";
      winnerSpan.textContent = "🏆";
      listItem.appendChild(winnerSpan);
    }

    listItem.appendChild(playerSpan);
    listItem.appendChild(scoreSpan);

    elements.gameResultScoreList.appendChild(listItem);
  });
}

// トップ画面に戻る
function endGame() {
  showScreen("top");
  initGameState();
  setupTopPage();
}

// ===========================================
//  ゲーム状態の管理
// ===========================================

// ゲーム状態の保存
function saveGameState() {
  try {
    localStorage.setItem("wordWolfGameState", JSON.stringify(gameState));
  } catch (error) {
    console.error("ゲーム状態の保存に失敗しました:", error);
  }
}

// ゲーム状態の初期化
function initGameState() {
  try {
    localStorage.removeItem("wordWolfGameState");
  } catch (error) {
    console.error("ゲーム状態の初期化に失敗しました:", error);
  }
}

// ゲーム状態の読み込み
function loadGameState() {
  try {
    const savedState = localStorage.getItem("wordWolfGameState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.assign(gameState, parsedState); // ゲーム状態を上書き

      // 各画面の状態を復元
      switch (gameState.currentScreen) {
        case "word-set":
          showWordSetScreen();
          break;
        case "word-distribution":
          showWordDistributionScreen();
          break;
        case "discussion":
          showDiscussionScreen();
          break;
        case "vote":
          showVoteScreen();
          break;
        case "vote-result":
          showVoteResultScreen();
          break;
        case "wolf-chance":
          showWolfChanceScreen();
          break;
        case "wolf-chance-result":
          showWolfChanceResultScreen();
          break;
        case "round-result":
          showRoundResult();
          break;
        case "game-result":
          showGameResultScreen();
          break;
      }
    }
  } catch (error) {
    console.error("ゲーム状態の読み込みに失敗しました:", error);
  }
}

// ===========================================
//  ページ読み込み時に初期化
// ===========================================

// ページ読み込み時に初期化
document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error("初期化に失敗しました:", error);
  });
});
