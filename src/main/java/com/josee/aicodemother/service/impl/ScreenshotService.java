package com.josee.aicodemother.service.impl;

public interface ScreenshotService {

    /**
     * 通用截图服务，可预得到访问地址
     *
     * @param webUrl 网址
     * @return
     */
    String generateAndUploadScreenshot(String webUrl);
}
