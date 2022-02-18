"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function readTextFile(file, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (rawFile.readyState === 4 && rawFile.status == 200) {
                    yield callback(rawFile.responseText);
                }
            });
        };
        rawFile.send(null);
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function $(element) {
    return document.querySelectorAll(element);
}
class Game {
    constructor() {
        this.pathes = {
            words: "./words.json",
            stats: "./stats.json"
        };
        this.n = 5;
        this.currentWord = new String();
        this.grid = new Array();
        this.wordList = new Array();
        this.stats = new Object();
        this.over = new Number();
        this.coordinates = { x: 1, y: 1 };
        this.solver = {
            not: new Set(""),
            right: new Map(),
            wrong: new Map()
        };
    }
    readWordList(path_ = this.pathes.words) {
        let this_ = this;
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield readTextFile(path_, function (text) {
                this_.wordList = JSON.parse(text).list.map(function (e) {
                    return e.toLowerCase();
                });
            });
            setTimeout(function () {
                resolve(this_.wordList);
            }, 2000);
        }));
    }
    readStats(path_ = this.pathes.stats) {
        return __awaiter(this, void 0, void 0, function* () {
            let this_ = this;
            yield readTextFile(path_, function (text) {
                this_.stats = JSON.parse(text);
            });
        });
    }
    pickWord(wordList) {
        let index = ~~(Math.random() * wordList.length);
        this.currentWord = wordList[index];
    }
    generateGame() {
        return __awaiter(this, void 0, void 0, function* () {
            let this_ = this;
            this.n = 5;
            this.currentWord = new String();
            this.grid = new Array();
            this.wordList = new Array();
            this.stats = new Object();
            this.over = new Number();
            this.coordinates = { x: 1, y: 1 };
            this.readWordList().then((resolve) => {
                this.pickWord(resolve);
            });
            $(".game")[0].innerHTML = "";
            for (let i = 0; i < 6; i++) {
                let row = document.createElement("div");
                let rowArr = new Array();
                row.classList.add("row");
                for (let j = 0; j < 5; j++) {
                    let col = document.createElement("div");
                    col.classList.add("col");
                    rowArr.push(col);
                    row.appendChild(col);
                }
                $(".game")[0].appendChild(row);
                this.grid.push(rowArr);
            }
        });
    }
    type(letter) {
        if (this.over == -1 || this.over == 1)
            return;
        let { x, y } = this.coordinates;
        if (letter == "Backspace") {
            if (x > 1) {
                this.grid[y - 1][x - 2].textContent = "";
                this.grid[y - 1][x - 2].classList.remove("filled");
                this.coordinates.x--;
            }
        }
        else if (letter == "Enter") {
            this.validate();
        }
        else {
            if (x <= 5) {
                this.grid[y - 1][x - 1].textContent = letter;
                this.grid[y - 1][x - 1].classList.add("filled");
                this.coordinates.x++;
            }
        }
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            let { x, y } = this.coordinates;
            y--;
            let temp = this.currentWord;
            if (y > 5)
                return;
            let word = this.grid[y].map((e) => e.textContent).join("");
            if (word.length != this.n)
                return;
            let found = this.wordList.includes(word.toLowerCase());
            let trues = 0;
            if (found) {
                for (let i = 0; i < this.n; i++) {
                    if (this.currentWord[i] == word[i]) {
                        this.grid[y][i].classList.add("done");
                        this.grid[y][i].classList.add("right");
                        trues++;
                        temp = temp.substring(0, i) + "-" + temp.substring(i + 1, 5);
                        this.solver.right.set(word[i], i);
                    }
                }
                for (let i = 0; i < this.n; i++) {
                    this.grid[y][i].classList.add("done");
                    if (!temp.includes(word[i])) {
                        this.grid[y][i].classList.add("wrong");
                        //this.solver.not.add(word[i]);
                    }
                    else {
                        if (!this.grid[y][i].classList.contains("right")) {
                            let s = temp.indexOf(word[i]);
                            this.grid[y][i].classList.add("semi");
                            temp = temp.substring(0, s) + temp.substring(s + 1, 5);
                            this.solver.wrong.set(word[i], i);
                        }
                    }
                    yield sleep(400);
                }
                this.coordinates.y++;
                this.coordinates.x = 1;
                if (trues == 5)
                    this.over = 1;
                else if (this.coordinates.y == 7)
                    this.over = -1;
            }
        });
    }
}
window.onkeypress = function (event) {
    if ((/[a-zA-z]/.test(event.key) && event.key.length == 1) || event.key == "Enter") {
        game.type(event.key);
    }
};
window.onkeyup = function (event) {
    if (event.key == "Backspace") {
        game.type("Backspace");
    }
};
let game = new Game();
game.generateGame();
class Solve {
    constructor() {
        this.containers = {
            notInc: new Set(),
            wrongP: new Set(),
            rightP: new Set(),
            Inc: new Set()
        };
        this.rules = {
            notInc: new RegExp(""),
            Inc: new RegExp(""),
            wrongP: [new RegExp("")],
            rightP: [new RegExp("")],
        };
    }
    notInc(str) {
        this.containers.notInc.add(str);
        let expStr = "[" + Array.from(this.containers.notInc).toString().replace(/,/g, "") + "]";
        this.rules.notInc = new RegExp(expStr);
    }
    P(arr, wrong = 1) {
        for (let rule of arr) {
            this.containers.Inc.add(rule[0]);
            let arr_ = new Array(5).fill(".");
            arr_[rule[1]] = rule[0];
            let expStr = arr_.join("");
            let regEx = new RegExp(expStr);
            if (wrong == 1) {
                this.rules.wrongP.push(regEx);
            }
            else {
                this.rules.rightP.push(regEx);
            }
        }
        let expStr = "";
        for (let rule of this.containers.Inc) {
            expStr += "(?=.*" + rule + ")";
        }
        this.rules.Inc = new RegExp(expStr);
    }
    test(str) {
        let res = true;
        res && (res = !this.rules.notInc.test(str));
        res && (res = this.rules.Inc.test(str));
        for (let i of this.rules.rightP) {
            if (i.toString()[2] != '?')
                res && (res = i.test(str));
        }
        for (let i of this.rules.wrongP) {
            if (i.toString()[2] != '?')
                res && (res = !i.test(str));
        }
        return res;
    }
    solve(list) {
        return list.filter(e => this.test(e));
    }
    solveGame(game, not) {
        this.notInc(not);
        for (let rule of game.solver.right.entries()) {
            this.P([rule], 0);
        }
        for (let rule of game.solver.wrong.entries()) {
            this.P([rule], 1);
        }
        console.log(this.solve(game.wordList));
    }
}
let solve = new Solve();
