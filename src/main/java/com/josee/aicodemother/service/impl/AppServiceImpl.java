package com.josee.aicodemother.service.impl;

import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.josee.aicodemother.model.entity.App;
import com.josee.aicodemother.mapper.AppMapper;
import com.josee.aicodemother.service.AppService;
import org.springframework.stereotype.Service;

/**
 * 应用 服务层实现。
 *
 * @author <a href="https://github.com/nanal233">Josee</a>
 */
@Service
public class AppServiceImpl extends ServiceImpl<AppMapper, App>  implements AppService{

}
