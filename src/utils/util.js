function isMatch(str, conditions) {
    str = str.toLowerCase();
    for (const condition of conditions) {
        if (str.indexOf(condition) !== -1) return true;
    }
    return false;
}

module.exports = {
    isMatch: isMatch,
    isBig5: (title) => {
        const conditions = ['big5', 'cht', '繁體', '繁体', '简繁', '繁简', '繁日', '日繁'];
        return isMatch(title, conditions);
    }
};