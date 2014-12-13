var fs = require('fs');

var SENTINEL = 'SENTINEL';


var Markov = module.exports = function Markov() {
    this.blobs = [];
    this.mapping = {};
};

Markov.prototype.addFile = function(path) {
    this.blobs.push(fs.readFileSync(path).toString());
};

Markov.prototype.chew = function() {
    var me = this;

    this.blobs.forEach(function(blob) {
        blob.split('\n').filter(function(x) {
            return !!x;
        }).map(function(x) {
            return x.trim();
        }).forEach(processSentence);
    });

    function processSentence(sentence) {
        if (!sentence) return;
        sentence = sentence.trim();

        if (sentence[0] === '"') {
            if (sentence.substr(1).indexOf('"') === -1) {
                return processSentence(sentence.substr(1));
            }
            return processSentence(/^"([^"]*)"/.exec(sentence)[1]);
        }

        if (sentence.indexOf('. ') !== -1) {
            return sentence.split('. ').forEach(processSentence);
        }

        var split = sentence.split(/ |-/);

        split.unshift(SENTINEL);
        split.push(SENTINEL);

        split.filter(function(word) {
            return (word.length > 2 ||
                    word === 'is' ||
                    word === 'be' ||
                    word === 'do' ||
                    word === 'an' ||
                    word === 'it' ||
                    word === 'in' ||
                    word === 'a' ||
                    word === 'he') &&
                !!/[a-z]/i.exec(word);
        }).forEach(function(word, i) {
            processWord(word, i, split)
        });
    }

    function processWord(word, i, arr) {
        if (i === 0) return;

        var prevWord = arr[i - 1];
        if (!(prevWord in me.mapping)) me.mapping[prevWord] = [];
        me.mapping[prevWord].push(word);

        if (i < 2) return;

        prevWord = arr[i - 2] + ' ' + prevWord;
        if (!(prevWord in me.mapping)) me.mapping[prevWord] = [];
        me.mapping[prevWord].push(word);

    }
};

Markov.prototype.get = function(startWord, length) {
    if (!startWord || !(startWord in this.mapping)) startWord = SENTINEL;
    var results = [startWord];

    var word;
    var list;
    while (results.length < length) {
        word = results.slice(-3).join(' ');
        if (!(word in this.mapping)) word = results.slice(-2).join(' ');
        if (!(word in this.mapping)) word = results.slice(-1)[0];

        if (!(word in this.mapping)) {
            console.log('Could not complete chain: ' + word);
            results[results.length - 1] += '.';
            word = SENTINEL;
        }

        list = this.mapping[word];
        results.push(list[Math.random() * list.length | 0]);
    }

    results = results.filter(function(x) {
        return x !== SENTINEL;
    });

    return results.join(' ');
};
