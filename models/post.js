var mongodb = require('./db'),
    markdown = require('markdown').markdown;

function Post(name, title, post) {
  this.name = name;
  this.title= title;
  this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {//存储一篇文章及其相关信息
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth()+1),
      day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
  }
  //要存入数据库的文档
  var post = {
      name: this.name,
      time: time,
      title:this.title,
      post: this.post,
      comments: []
  };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
          safe: true
      }, function (err,post) {
        mongodb.close();
        callback(err,post);//成功！返回插入的文档
      });
    });
  });
};

Post.getTen = function(name, page, callback) {//一次获取十篇文章
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的10个结果
      collection.find(query,{skip:(page-1)*10,limit:10}).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          callback(err, null);//失败！返回 null
        }
        //解析 markdown 为 html
        docs.forEach(function(doc){
          doc.post = markdown.toHTML(doc.post);
        });
        callback(null, docs);//成功！以数组形式返回查询的结果
      });
    });
  });
};

Post.getOne = function(name, day, title, callback) {//获取一篇文章
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行精确查询
      collection.findOne({"name":name,"time.day":day,"title":title},function (err, doc) {
        mongodb.close();
        if (err) {
          callback(err, null);
        }
        //解析 markdown 为 html
        doc.post = markdown.toHTML(doc.post);
        doc.comments.forEach(function(comment){
          comment.content = markdown.toHTML(comment.content);
        });
        callback(null, doc);//返回特定查询的文章
      });
    });
  });
};

Post.getArchive = function(callback) {//返回所有文章
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //返回只包含name、time、title的文档组成的数组
      collection.find({},{"name":1,"time":1,"title":1}).sort({
        time:-1
      }).toArray(function(err, docs){
        mongodb.close();
        if (err) {
          callback(err, null);
        }
        callback(null, docs);
      });
    });
  });
};