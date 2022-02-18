async function readTextFile(file : string, callback : Function) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = async function() {
        if (rawFile.readyState === 4 && rawFile.status == 200) {
            await callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function sleep(ms : number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function $(element : string) : NodeListOf<Element> {
    return document.querySelectorAll(element);
}
class Game{
    pathes = {
        words : "./words.json",
        stats : "./stats.json"
    }
    n = 5;
    currentWord = new String();
    grid = new Array();
    wordList = new Array();
    stats = new Object();
    over = new Number();
    coordinates = {x : 1, y : 1}
    solver = { 
        not : new Set(""),
        right : new Map<string, number>(), 
        wrong : new Map<string, number>()  
    }
    readWordList(path_ = this.pathes.words){
       let this_ = this;
       return new Promise(async (resolve, reject) => {
            await readTextFile(path_, function(text : any): void{
                this_.wordList = JSON.parse(text).list.map(function(e:String){
                    return e.toLowerCase()
                });
            })
            setTimeout(function(){
                resolve(this_.wordList)
            },2000);
       }) 
    }
    async readStats(path_ = this.pathes.stats){
        let this_ = this;
        await readTextFile(path_, function(text : any) : void{
            this_.stats = JSON.parse(text);
        })
    }
    pickWord(wordList : String[]) : any{
        let index : number = ~~(Math.random() * wordList.length);
        this.currentWord = wordList[index];
    }
    async generateGame(){
        let this_ = this;
        this.n = 5;
        this.currentWord = new String();
        this.grid = new Array();
        this.wordList = new Array();
        this.stats = new Object();
        this.over = new Number();
        this.coordinates = {x : 1, y : 1}
        this.readWordList().then((resolve : any) => {
            this.pickWord(resolve);
        });
        $(".game")[0].innerHTML = "";
        for(let i = 0; i < 6; i++){
            let row : Element = document.createElement("div");
            let rowArr: Array<Element> = new Array();
            row.classList.add("row");
            for(let j = 0; j < 5; j++){
                let col : Element = document.createElement("div");
                col.classList.add("col");
                rowArr.push(col);
                row.appendChild(col);
            }
            $(".game")[0].appendChild(row);
            this.grid.push(rowArr);
        }
    }
    type(letter : String) : void{
        if(this.over == -1 || this.over == 1) return;
        let {x, y} = this.coordinates;
        if(letter == "Backspace"){
            if(x > 1){
                this.grid[y-1][x-2].textContent = "";
                this.grid[y-1][x-2].classList.remove("filled");
                this.coordinates.x--;
            }
        }else if(letter == "Enter"){
            this.validate();
        }else{
            if(x <= 5){
                this.grid[y-1][x-1].textContent = letter;
                this.grid[y-1][x-1].classList.add("filled");
                this.coordinates.x++;
            }
        }

    }
    async validate(){
        let {x, y} = this.coordinates;
        y--;
        let temp : String = this.currentWord;
        if(y > 5) return;
        let word : String = this.grid[y].map((e:Element)=>e.textContent).join("");
        if(word.length != this.n) return;
        let found : Boolean = this.wordList.includes(word.toLowerCase());
        let trues = 0;
        if(found){
            for(let i = 0; i < this.n; i++){
                if(this.currentWord[i] == word[i]){
                    this.grid[y][i].classList.add("done")
                    this.grid[y][i].classList.add("right");
                    trues++;
                    temp = temp.substring(0, i) + "-" + temp.substring(i+1, 5);
                    this.solver.right.set(word[i], i); 
                }
            }
            for(let i = 0; i < this.n; i++){
                this.grid[y][i].classList.add("done");
                if(!temp.includes(word[i])){
                    this.grid[y][i].classList.add("wrong");
                    //this.solver.not.add(word[i]);
                }else{
                    if(!this.grid[y][i].classList.contains("right")){
                        let s : number = temp.indexOf(word[i]); 
                        this.grid[y][i].classList.add("semi");
                        temp = temp.substring(0,s) + temp.substring(s+1, 5);
                        this.solver.wrong.set(word[i], i);
                    }
                }
                await sleep(400);
            }
            this.coordinates.y++;
            this.coordinates.x = 1;
            if(trues==5) this.over = 1;
            else if(this.coordinates.y == 7) this.over = -1;
        }
    }
}
window.onkeypress = function(event){
    if((/[a-zA-z]/.test(event.key) && event.key.length == 1 )|| event.key == "Enter"){
        game.type(event.key);
    }
}
window.onkeyup= function(event){
    if(event.key == "Backspace"){
        game.type("Backspace")
    }
}
let game = new Game();
game.generateGame();

class Solve{
    containers = {
        notInc : new Set(),
        wrongP : new Set(),
        rightP : new Set(),
        Inc : new Set()
    }
    rules = {
        notInc : new RegExp(""),
        Inc : new RegExp(""),
        wrongP : [new RegExp("")],
        rightP : [new RegExp("")],
    }
    notInc(str : string){
        this.containers.notInc.add(str)
        let expStr : string = "[" + Array.from(this.containers.notInc).toString().replace(/,/g, "") + "]"
        this.rules.notInc = new RegExp(expStr)
    }
    P(arr : any[], wrong = 1){
        for(let rule of arr){
            this.containers.Inc.add(rule[0])
            let arr_ = new Array(5).fill(".");
            arr_[rule[1]] = rule[0]
            let expStr : string = arr_.join("")
            let regEx : RegExp = new RegExp(expStr);
            if(wrong == 1){
                this.rules.wrongP.push(regEx)
            }else{
                this.rules.rightP.push(regEx)
            }
        }
        let expStr : string = "";
        for (let rule of this.containers.Inc){
            expStr+="(?=.*"+rule+")"
        }
        this.rules.Inc = new RegExp(expStr)
    }
    test(str : string) : boolean{
        let res : boolean = true;
        res &&= !this.rules.notInc.test(str);
        res &&= this.rules.Inc.test(str);
        for(let i of this.rules.rightP){
            if(i.toString()[2] != '?') res &&= i.test(str);
        }
        for(let i of this.rules.wrongP){
            if(i.toString()[2] != '?') res &&= !i.test(str);
        }
        return res;
    }
    solve(list : string[]){
        return list.filter(e => this.test(e))
    }
    solveGame(game : Game, not : string){
        this.notInc(not)
        for(let rule of game.solver.right.entries()){
            this.P([rule], 0)
        }
        for(let rule of game.solver.wrong.entries()){
            this.P([rule], 1)
        }
        console.log(this.solve(game.wordList))
    }
}
let solve = new Solve();

// aisle - mourn - fetch - biped
// other - snail
// tubes - fling - champ - wordy