const mongoose= require('mongoose')
const crypto=require('crypto')
const jwt=require('jsonwebtoken')

let UserSchema = mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    admin: { type: Boolean },
    vendor:{type:Boolean},
    hash: { type: String},
    salt: {type: String }
})
UserSchema.methods.savePassword = function (password)
{
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000,64,"sha512").toString('hex')
}

UserSchema.methods.validatePassword = function (password)
{
    hash = crypto.pbkdf2Sync(password, this.salt, 1000,64,"sha512").toString('hex')
    return hash === this.hash;
}

UserSchema.methods.generateJwt = function()
{
    var expire = new Date();
    expire.setDate(expire.getDate()+7);

    return jwt.sign({
        _id: this._id,
        role:this.getRole(),
        expire: parseInt(expire.getTime()/1000)
    }, "SECRET")
}
UserSchema.methods.getRole = function()
{
    if (this.admin)
        return 'ADMIN';
    else if(this.vendor)
        return 'VENDOR'
    return 'USER';
}
var UserModel=mongoose.model('user',UserSchema)

UserModel.register=async function(email,username,password)
{
    var user=new UserModel({
        email:email,
        username:username,
        admin:false,
        vendor:true
    })
    user.savePassword(password)
    try {
        await user.save();
        console.log(user);
        console.log(user.generateJwt);
        return user.generateJwt()
    } catch (error) {
        console.log(error);
        return null;
    }
}
UserModel.saveUser = async function(email,username,password)
{
    let user=new UserModel({
        email:email,
        username:username,
        admin:false,
        vendor:true
    })
    user.savePassword(password)
    user.save();
    
    return user

}
UserModel.updateUser = async function (userObj){
    let user = await UserModel.findById(userObj._id);
    user.email=userObj.email
    user.username=userObj.username
    user.savePassword(userObj.password)
    user.save();

    return user;
}

UserModel.deleteById = async function(id){
        
    let success = await UserModel.findOneAndDelete({ _id: id }).then(async function(user){
        return !!(typeof user !== 'undefined' && user);
    });

    return success;
}

module.exports=UserModel