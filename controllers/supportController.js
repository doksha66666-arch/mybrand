const SupportConfig = require('../models/SupportConfig');
const SupportTicket = require('../models/SupportTicket');

const defaults = {
  enabled: true,
  title: 'خدمة العملاء',
  subtitle: 'نحن معك في كل خطوة من الطلب حتى الاستلام.',
  phone: '', whatsapp: '', email: '',
  hours: 'يوميًا من 10 صباحًا حتى 10 مساءً',
  responseTime: 'الرد عادة خلال دقائق',
};

exports.getSupportConfig = async (req, res, next) => { try { const config = await SupportConfig.findOne().lean(); res.json({ support: { ...defaults, ...(config || {}) } }); } catch (error) { next(error); } };
exports.updateSupportConfig = async (req, res, next) => { try { const allowed=['enabled','title','subtitle','phone','whatsapp','email','hours','responseTime']; const update={}; allowed.forEach(k=>{if(req.body[k]!==undefined)update[k]=req.body[k]}); const config=await SupportConfig.findOneAndUpdate({},update,{new:true,upsert:true,setDefaultsOnInsert:true}); res.json({support:{...defaults,...config.toObject()},message:'تم حفظ إعدادات خدمة العملاء'}); } catch(error){next(error);} };

exports.createTicket = async (req,res,next)=>{try{const {subject,message,orderId,category}=req.body;if(!subject||!message)return res.status(400).json({message:'الموضوع والرسالة مطلوبان'});const ticket=await SupportTicket.create({user:req.user._id,subject,category:category||'other',order:orderId||null,messages:[{sender:req.user._id,senderRole:'customer',text:message}]});res.status(201).json({ticket});}catch(error){next(error);}};
exports.myTickets = async (req,res,next)=>{try{const tickets=await SupportTicket.find({user:req.user._id}).sort({createdAt:-1});res.json({tickets});}catch(error){next(error);}};
exports.allTickets = async (req,res,next)=>{try{const tickets=await SupportTicket.aggregate([
  {$sort:{createdAt:-1}},
  {$limit:100},
  {$project:{_id:1,user:1,subject:1,category:1,status:1,createdAt:1,updatedAt:1,lastMessage:{$arrayElemAt:['$messages',-1]}}},
  {$lookup:{from:'users',localField:'user',foreignField:'_id',as:'user'}},
  {$unwind:{path:'$user',preserveNullAndEmptyArrays:true}},
  {$project:{_id:1,subject:1,category:1,status:1,createdAt:1,updatedAt:1,lastMessage:1,user:{name:1,email:1}}},
]);res.json({tickets});}catch(error){next(error);}};\nexports.getAdminTicket = async (req,res,next)=>{try{const ticket=await SupportTicket.findById(req.params.id).populate('user','name email phone').lean();if(!ticket)return res.status(404).json({message:'التذكرة غير موجودة'});res.json({ticket});}catch(error){next(error);}};
exports.replyTicket = async (req,res,next)=>{try{const {text}=req.body;if(!text)return res.status(400).json({message:'الرسالة مطلوبة'});const ticket=await SupportTicket.findOne({_id:req.params.id,user:req.user._id});if(!ticket)return res.status(404).json({message:'التذكرة غير موجودة'});if(ticket.status==='closed')return res.status(400).json({message:'التذكرة مغلقة'});ticket.messages.push({sender:req.user._id,senderRole:'customer',text});await ticket.save();res.json({ticket});}catch(error){next(error);}};
exports.adminUpdateTicket = async (req,res,next)=>{try{const {status,text}=req.body;const ticket=await SupportTicket.findById(req.params.id);if(!ticket)return res.status(404).json({message:'التذكرة غير موجودة'});if(status)ticket.status=status;if(text)ticket.messages.push({sender:req.user._id,senderRole:'admin',text});await ticket.save();res.json({ticket});}catch(error){next(error);}};