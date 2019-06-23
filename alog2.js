const { spawn } = require('child_process');

function runAlog(imagePath) {
  return new Promise((success, nosuccess) => {
    console.log('promise started');
    try {
      const pyprog = spawn('python3', ['./alog2.py', '-p', imagePath, '-l', '50', '-n', '25']);

      pyprog.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      pyprog.on('close', (code) => {
        if(code === 0) {
          success({data:'no data, but its ok'});
        }
        else {
          console.log('code', code);
          nosuccess({msg:'job was not done correctly'});
        }
      });
    } catch(err) {
      console.log(err)
    }
  });
}

module.exports = {
  runAlog
};