export default function testRole(req,res){
    res.status(200).json({
        success: true,
        message: 'Test role endpoint hit successfully'
    });
}