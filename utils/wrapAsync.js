module.exports = (fnxn) => {
  return (req, res, next) => {
    fnxn(req, res, next).catch(next);
  };
};
