package com.josee.aicodemother.config;

import dev.langchain4j.community.store.memory.chat.redis.RedisChatMemoryStore;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


/**
 *
 * Redis 持久化对话记忆
 */
@Configuration
@ConfigurationProperties(prefix = "spring.data.redis")
@Data
public class RedisChatMemoryStoreConfig {

    private String host;

    private int port;

    private String password;

    private long ttl;

    @Bean
    public RedisChatMemoryStore redisChatMemoryStore() {
        RedisChatMemoryStore.Builder builder = RedisChatMemoryStore.builder()
                .host(host)
                .port(port)
                .ttl(ttl);
        // RedisChatMemoryStore 内部只有在 user 非空时才会真正带上密码去认证（user 为 null 时会建立完全不认证的连接，
        // password 会被直接忽略）。Redis 只配置了 requirepass、没有额外 ACL 用户时，默认账号名就是 "default"。
        if (password != null && !password.isBlank()) {
            builder.user("default").password(password);
        }
        return builder.build();
    }
}
