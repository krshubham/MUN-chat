/**
 * Created by ks on 03/03/17.
 */
import express from 'express';
const router  = express.Router();

router.get('/', (req,res) => {
    res.render('press_login',{
        title: 'Internation Press | VITC MUN'
    });
});

export default router;