module.exports = {
  servers: {
    staging: {
      host: '52.205.22.52',
      username: 'ubuntu',
	pem : '/home/ubuntu/.ssh/KeyOfHeroes.pem'
    }
  },

  meteor: {
    name: 'whizcart',
    path: '/home/ubuntu/whizcart',
    servers: {
      staging: {}
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: 'http://52.205.22.52:8000',
      MONGO_URL: 'mongodb://localhost/meteor'
    },

    //dockerImage: 'kadirahq/meteord'
    deployCheckWaitTime: 60,
	dockerImage: 'abernix/meteord:base'
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      staging: {},
    },
  },
};
