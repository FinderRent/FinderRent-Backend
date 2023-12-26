
/**
 * insted of doing try+catch on every function, it do it automaticly.
 * @param {} fn 
 * @returns 
 */
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

