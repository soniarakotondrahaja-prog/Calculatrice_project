const display = document.getElementById('display');
const history = document.getElementById('history');
const logPanel = document.getElementById('log');
const logList = document.getElementById('logList');
const logToggle = document.getElementById('logToggle');
const logClear = document.getElementById('logClear');

let current = '0';
let previous = null;
let operator = null;
let justEvaluated = false;
let calcLog = [];

const OP_SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷'
};

function updateScreen() {
  display.textContent = formatForDisplay(current);
  if (operator && previous !== null) {
    history.textContent = `${formatForDisplay(previous)} ${OP_SYMBOLS[operator]}`;
  } else {
    history.textContent = '\u00A0';
  }
}

function formatForDisplay(value) {
  // value is stored internally with "." as decimal separator
  // display uses "," (French convention)
  return value.replace('.', ',');
}

function inputDigit(digit) {
  if (justEvaluated) {
    current = digit === '.' ? '0.' : digit;
    justEvaluated = false;
    updateScreen();
    return;
  }

  if (digit === '.') {
    if (current.includes('.')) return;
    current = current === '0' ? '0.' : current + '.';
    updateScreen();
    return;
  }

  if (current === '0') {
    current = digit;
  } else {
    if (current.replace('-', '').replace('.', '').length >= 15) return;
    current += digit;
  }
  updateScreen();
}

function clearAll() {
  current = '0';
  previous = null;
  operator = null;
  justEvaluated = false;
  updateScreen();
}

function eraseLast() {
  if (justEvaluated) {
    clearAll();
    return;
  }
  if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
    current = '0';
  } else {
    current = current.slice(0, -1);
  }
  updateScreen();
}

function toggleSign() {
  if (current === '0') return;
  current = current.startsWith('-') ? current.slice(1) : '-' + current;
  updateScreen();
}

function percent() {
  const value = parseFloat(current);
  if (isNaN(value)) return;
  current = String(value / 100);
  updateScreen();
}

function chooseOperator(nextOperator) {
  if (operator && previous !== null && !justEvaluated) {
    // chain operations: evaluate what we have so far first
    compute();
  }
  previous = current;
  operator = nextOperator;
  current = '0';
  justEvaluated = false;
  updateScreen();
}

function compute() {
  if (operator === null || previous === null) return;

  const a = parseFloat(previous);
  const b = parseFloat(current);
  let result;

  switch (operator) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) {
        display.textContent = 'Erreur';
        history.textContent = 'Division par 0';
        current = '0';
        previous = null;
        operator = null;
        justEvaluated = true;
        return;
      }
      result = a / b;
      break;
    default:
      return;
  }

  // avoid floating point noise, keep reasonable precision
  result = Math.round(result * 1e10) / 1e10;

  addToLog(a, operator, b, result);

  current = String(result);
  previous = null;
  operator = null;
  justEvaluated = true;
  updateScreen();
}

function addToLog(a, op, b, result) {
  const entry = {
    expression: `${formatForDisplay(String(a))} ${OP_SYMBOLS[op]} ${formatForDisplay(String(b))}`,
    result: formatForDisplay(String(result))
  };
  calcLog.unshift(entry); // le plus récent en premier
  if (calcLog.length > 50) calcLog.pop(); // évite que ça grossisse à l'infini
  renderLog();
}

function renderLog() {
  logList.innerHTML = '';

  if (calcLog.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'calc__log-empty';
    empty.textContent = 'Aucun calcul pour le moment';
    logList.appendChild(empty);
    return;
  }

  calcLog.forEach((entry) => {
    const li = document.createElement('li');

    const expr = document.createElement('span');
    expr.className = 'log-expr';
    expr.textContent = entry.expression;

    const res = document.createElement('span');
    res.className = 'log-result';
    res.textContent = '= ' + entry.result;

    li.appendChild(expr);
    li.appendChild(res);
    logList.appendChild(li);
  });
}

logToggle.addEventListener('click', () => {
  const isHidden = logPanel.hasAttribute('hidden');
  if (isHidden) {
    logPanel.removeAttribute('hidden');
    logToggle.setAttribute('aria-expanded', 'true');
    logToggle.textContent = 'Historique ▴';
  } else {
    logPanel.setAttribute('hidden', '');
    logToggle.setAttribute('aria-expanded', 'false');
    logToggle.textContent = 'Historique ▾';
  }
});

logClear.addEventListener('click', () => {
  calcLog = [];
  renderLog();
});

renderLog();

document.querySelectorAll('.key').forEach((key) => {
  key.addEventListener('click', () => {
    const digit = key.dataset.num;
    const action = key.dataset.action;

    if (digit !== undefined) {
      inputDigit(digit);
      return;
    }

    switch (action) {
      case 'clear':
        clearAll();
        break;
      case 'erase':
        eraseLast();
        break;
      case 'percent':
        percent();
        break;
      case 'equals':
        compute();
        break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        chooseOperator(action);
        break;
    }
  });
});

// Support clavier
window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    inputDigit(e.key);
  } else if (e.key === '.' || e.key === ',') {
    inputDigit('.');
  } else if (e.key === '+') {
    chooseOperator('add');
  } else if (e.key === '-') {
    chooseOperator('subtract');
  } else if (e.key === '*') {
    chooseOperator('multiply');
  } else if (e.key === '/') {
    e.preventDefault();
    chooseOperator('divide');
  } else if (e.key === 'Enter' || e.key === '=') {
    compute();
  } else if (e.key === 'Backspace') {
    eraseLast();
  } else if (e.key === 'Escape') {
    clearAll();
  } else if (e.key === '%') {
    percent();
  }
});

updateScreen();
