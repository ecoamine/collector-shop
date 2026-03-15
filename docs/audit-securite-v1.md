# Audit de la sécurité actuelle – V1 (état des lieux)

Document de référence pour l’étape 7.1 « Audit de la sécurité actuelle de la V1 ». Aucune modification du projet ; état des lieux uniquement.

---

## 1. Configuration Spring Security

### 1.1 Fichier principal

**Chemin :** `backend/src/main/java/com/collectorshop/config/SecurityConfig.java`

```java
package com.collectorshop.config;

import com.collectorshop.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/items/**", "/api/categories").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### 1.2 Règles d’accès aux routes (résumé)

| Règle | Chemins | Effet |
|-------|--------|--------|
| `permitAll()` | `/actuator/health`, `/actuator/info` | Accès sans authentification |
| `permitAll()` | `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` | Doc API publique |
| `permitAll()` | `/api/auth/**` | Login et register publics |
| `permitAll()` | `GET /api/items/**`, `GET /api/categories` | Catalogue et catégories en lecture seule publics |
| `authenticated()` | Tout le reste | JWT requis ; rôles gérés ensuite par `@PreAuthorize` dans les contrôleurs |

### 1.3 CORS / CSRF / Session

- **CSRF :** désactivé (`csrf.disable()`), cohérent avec une API stateless JWT consommée par un front séparé.
- **CORS :** activé via `corsConfigurationSource()` :
  - Origines autorisées : `http://localhost:5173` uniquement.
  - Méthodes : GET, POST, PUT, DELETE, OPTIONS.
  - En-têtes : tous (`*`).
  - Credentials : autorisés (`setAllowCredentials(true)`).
- **Session :** stateless (`SessionCreationPolicy.STATELESS`). Pas de session serveur ; l’état d’authentification est porté par le JWT.

### 1.4 Endpoints publics vs protégés

- **Publics (sans JWT) :** santé Actuator, Swagger, auth (login/register), GET items et GET categories.
- **Protégés (JWT requis) :** tout le reste. Le filtre JWT remplit le `SecurityContext` ; les contrôleurs utilisent `@PreAuthorize("hasRole('SELLER')")` ou `@PreAuthorize("hasRole('ADMIN')")` pour restreindre par rôle.

---

## 2. Logique JWT

### 2.1 Service de génération / validation du token

**Chemin :** `backend/src/main/java/com/collectorshop/security/JwtService.java`

- **Rôle :** génération du token, extraction du sujet (username) et des claims, vérification de validité (signature + expiration).
- **Configuration :** clé HMAC et durée de vie injectées via `@Value("${jwt.secret}")` et `@Value("${jwt.expiration-ms}")`.
- **Génération :** `generateToken(username, role)` construit un JWT avec :
  - claim custom `role` (nom du rôle),
  - sujet = username,
  - `issuedAt` et `expiration`,
  - signature HS256.
- **Validation :** `isTokenValid(token, userDetails)` vérifie que le sujet du token correspond au `UserDetails` et que le token n’est pas expiré (`extractClaim` pour l’expiration).
- Pas d’extraction du rôle côté service ; le rôle est porté par les `GrantedAuthority` du `UserDetails` chargé après extraction du username.

### 2.2 Filtre JWT

**Chemin :** `backend/src/main/java/com/collectorshop/security/JwtAuthenticationFilter.java`

- **Type :** `OncePerRequestFilter`, exécuté avant la chaîne Spring Security standard.
- **Comportement :**
  1. Lit l’en-tête `Authorization` ; si absent ou ne commençant pas par `"Bearer "`, laisse passer sans authentifier.
  2. Extrait le token (après `"Bearer "`), puis le username via `JwtService.extractUsername(token)`.
  3. Si un username est trouvé et qu’il n’y a pas encore d’authentification dans le contexte :
     - charge le `UserDetails` via `UserDetailsService.loadUserByUsername(username)`,
     - vérifie le token avec `JwtService.isTokenValid(token, userDetails)`,
     - en cas de succès, crée un `UsernamePasswordAuthenticationToken` avec le `UserDetails` et ses autorités, et le place dans `SecurityContextHolder`.
  4. Appelle toujours `filterChain.doFilter(request, response)` (succès ou échec d’auth).
- **Dépendances :** `JwtService`, `UserDetailsService` (injection `@Lazy` pour éviter cycle).

### 2.3 Chargement de l’utilisateur et des rôles (UserDetailsService)

**Chemin :** `backend/src/main/java/com/collectorshop/config/UserDetailsConfig.java`

- **Rôle :** fournit le `UserDetailsService` utilisé par le filtre JWT et par l’authentification login (AuthenticationManager).
- **Comportement :** pour un `username`, charge l’entité `User` depuis `UserRepository`, crée une autorité `ROLE_<role.name()>` (ex. `ROLE_SELLER`), et retourne un `org.springframework.security.core.userdetails.User` avec username, password (hash en base) et cette autorité.
- Les rôles applicatifs sont donc exposés à Spring Security sous la forme `ROLE_BUYER`, `ROLE_SELLER`, `ROLE_ADMIN`.

**Côté frontend (lecture du rôle pour l’UI uniquement) :**  
**Chemin :** `frontend/src/utils/jwt.js`

- Décodage du payload JWT côté client (sans vérification de signature) pour lire le claim `role` et afficher la bonne UI (liens Sell, Admin, etc.).
- Le fichier précise que ce décodage ne doit pas servir à des décisions de sécurité ; la sécurité repose sur la validation du token par le backend.

---

## 3. Exemples de contrôleurs protégés

### 3.1 Endpoint protégé par authentification (implicite)

Les routes non listées en `permitAll()` dans `SecurityConfig` nécessitent un JWT valide. Exemple : **aucun** endpoint du catalogue en écriture n’est public ; les contrôleurs suivants sont donc protégés par authentification dès qu’on appelle une méthode.

### 3.2 Endpoint protégé par rôle SELLER

**Chemin :** `backend/src/main/java/com/collectorshop/controller/SellerItemController.java`

```java
@RestController
@RequestMapping("/api/seller/items")
@RequiredArgsConstructor
public class SellerItemController {

    private final ItemService itemService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemListingResponse createItem(Authentication authentication,
                                          @Valid @RequestBody CreateItemRequest request) {
        String username = authentication.getName();
        return itemService.createItemForSeller(request, username);
    }
}
```

- Seuls les utilisateurs avec le rôle `SELLER` peuvent appeler `POST /api/seller/items`.
- Le vendeur est identifié par `authentication.getName()` (username du JWT) et passé au service.

### 3.3 Endpoints protégés par rôle ADMIN

**Chemin :** `backend/src/main/java/com/collectorshop/controller/AdminCategoryController.java`

```java
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return categoryService.createCategory(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }
}
```

- Toute la classe est protégée par `@PreAuthorize("hasRole('ADMIN')")` : seuls les `ADMIN` peuvent créer ou supprimer des catégories.
- `POST /api/admin/categories` et `DELETE /api/admin/categories/{id}` sont donc réservés aux admins.

### 3.4 Endpoints publics (sans rôle)

**ItemController** (`/api/items`) et **CategoryController** (`/api/categories`) n’ont pas d’annotation `@PreAuthorize` ; ils sont rendus publics uniquement par la configuration dans `SecurityConfig` pour les `GET` (`.requestMatchers(HttpMethod.GET, "/api/items/**", "/api/categories").permitAll()`).

---

## 4. Configuration applicative sensible

### 4.1 Fichier principal (défaut)

**Chemin :** `backend/src/main/resources/application.yml`

```yaml
spring:
  application:
    name: collector-shop

  datasource:
    url: jdbc:postgresql://localhost:5432/collector_shop
    username: collector_shop
    password: collector_shop

  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
    properties:
      hibernate:
        format_sql: true

jwt:
  secret: "change-this-secret-key-for-prod-32-bytes-minimum-1234"
  expiration-ms: 3600000

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info

logging:
  level:
    root: INFO
```

- **Base de données :** URL, username et password en clair dans le fichier (à remplacer par variables d’environnement ou secrets en production).
- **JWT :** `jwt.secret` (clé HMAC, 32 caractères minimum recommandé), `jwt.expiration-ms` (3600000 ms = 1 heure). Le secret actuel est une valeur d’exemple à ne pas utiliser en production.

### 4.2 Profil Docker

**Chemin :** `backend/src/main/resources/application-docker.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/collector_shop
    username: collector_shop
    password: collector_shop

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info
```

- Utilisé lorsque le profil `docker` est actif (ex. `SPRING_PROFILES_ACTIVE=docker`).
- Surcharge uniquement la datasource (host `db`) et confirme le port et l’exposition Actuator. Les propriétés JWT et le reste viennent de `application.yml` sauf surcharge par variables d’environnement.

### 4.3 Variables sensibles (résumé)

| Usage | Propriété / source | Remarque |
|-------|--------------------|----------|
| DB URL | `spring.datasource.url` | Défaut local puis Docker (`db:5432`) |
| DB utilisateur | `spring.datasource.username` | Valeur fixe dans les YAML |
| DB mot de passe | `spring.datasource.password` | Valeur fixe dans les YAML |
| JWT clé de signature | `jwt.secret` | Une seule valeur dans `application.yml` ; à externaliser et renforcer en prod |
| JWT expiration | `jwt.expiration-ms` | 3600000 (1 h) |

Pour l’audit, les secrets réels peuvent être masqués (ex. `password: ****`) ; la structure ci-dessus décrit ce qui est configuré.

---

## 5. Gestion globale des erreurs

**Chemin :** `backend/src/main/java/com/collectorshop/exception/GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        enrich(problem);
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        problem.setProperty("errors", errors);
        enrich(problem);
        return problem;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        enrich(problem);
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        enrich(problem);
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
        enrich(problem);
        return problem;
    }

    private void enrich(ProblemDetail problem) {
        problem.setProperty("timestamp", OffsetDateTime.now());
    }
}
```

- **RFC 7807 ProblemDetail :** toutes les réponses d’erreur passent par `ProblemDetail` (type, status, detail, propriétés).
- **Validation :** `MethodArgumentNotValidException` (échec de `@Valid`) → 400 avec une map `errors` (champ → message).
- **Autorisation / authentification :** `BadCredentialsException` (login incorrect) → 401 avec message générique « Invalid username or password ».
- **Ressource absente :** `NotFoundException` → 404 avec le message de l’exception.
- **Règles métier :** `IllegalArgumentException` (ex. « Username already exists ») → 400.
- **Erreur générique :** tout autre `Exception` → 500 avec message « Unexpected error » (pas d’exposition du détail au client).
- **Enrichissement :** propriété `timestamp` (OffsetDateTime) sur chaque problème.

**Classe d’exception utilisée :** `com.collectorshop.exception.NotFoundException` (RuntimeException avec message), chemin : `backend/src/main/java/com/collectorshop/exception/NotFoundException.java`.

---

## 6. DTO de sécurité / validation

### 6.1 Auth

**LoginRequest** – `backend/src/main/java/com/collectorshop/dto/LoginRequest.java`

- `username` : `@NotBlank`
- `password` : `@NotBlank`  
Utilisé avec `@Valid` dans `AuthController.login()`.

**RegisterRequest** – `backend/src/main/java/com/collectorshop/dto/RegisterRequest.java`

- `username` : `@NotBlank`, `@Size(min = 3, max = 50)`
- `password` : `@NotBlank`, `@Size(min = 6, max = 100)`
- `role` : optionnel (type `Role` enum)  
Utilisé avec `@Valid` dans `AuthController.register()`.

**AuthResponse** – `backend/src/main/java/com/collectorshop/dto/AuthResponse.java`

- Un seul champ : `token` (String). Pas d’annotation de validation (réponse côté serveur).

### 6.2 Création d’item (vendeur)

**CreateItemRequest** – `backend/src/main/java/com/collectorshop/dto/CreateItemRequest.java`

- `title` : `@NotBlank`, `@Size(max = 200)`
- `description` : `@Size(max = 10_000)` (optionnel)
- `price` : `@NotNull`, `@DecimalMin(value = "0.0", inclusive = false)`
- `imageUrl` : `@Size(max = 500)` (optionnel)
- `categoryId` : `@NotNull`  
Utilisé avec `@Valid` dans `SellerItemController.createItem()`.

### 6.3 Création de catégorie (admin)

**CreateCategoryRequest** – `backend/src/main/java/com/collectorshop/dto/CreateCategoryRequest.java`

- `name` : `@NotBlank`, `@Size(max = 100)`  
Utilisé avec `@Valid` dans `AdminCategoryController.createCategory()`.

Aucun usage de `@Email` dans les DTO actuels. Les contraintes utilisées sont : `@NotBlank`, `@NotNull`, `@Size`, `@DecimalMin`.

---

## 7. Points de sécurité visibles dans le code

### 7.1 Hash des mots de passe

- **Algorithme :** BCrypt, via le bean `PasswordEncoder` (BCryptPasswordEncoder) dans `SecurityConfig`.
- **Où c’est utilisé :**
  - **Enregistrement :** `AuthService.register()` — `passwordEncoder.encode(request.getPassword())` avant de sauvegarder l’utilisateur en base.
  - **Login :** Spring Security compare le mot de passe fourni au hash stocké via `AuthenticationManager.authenticate()` ; le `UserDetailsService` retourne l’utilisateur avec le mot de passe hashé, et le comparateur utilise le même `PasswordEncoder`.
- Les migrations Flyway (V3, V4) insèrent des utilisateurs de test avec des hash BCrypt pré-calculés (pas de mot de passe en clair en base).

### 7.2 Gestion des rôles

- **Modèle :** enum `Role` (BUYER, SELLER, ADMIN) dans `backend/.../domain/Role.java` ; champ `role` sur l’entité `User`.
- **Spring Security :** `UserDetailsConfig` expose une autorité `ROLE_<role.name()>` par utilisateur. Les contrôleurs utilisent `@PreAuthorize("hasRole('SELLER')")` ou `@PreAuthorize("hasRole('ADMIN')")` ; `EnableMethodSecurity` est activé dans `SecurityConfig`.
- **JWT :** le claim personnalisé `role` est ajouté à la génération du token et lu côté frontend uniquement pour l’affichage (navigation, liens). Les décisions d’accès sont prises côté backend (filtre + `UserDetailsService` + `@PreAuthorize`).

### 7.3 Actuator

- **Exposition :** dans `application.yml` et `application-docker.yml`, `management.endpoints.web.exposure.include` est limité à `health,info`.
- **Sécurité :** dans `SecurityConfig`, seuls `/actuator/health` et `/actuator/info` sont en `permitAll()`. Les autres endpoints Actuator (s’ils étaient exposés) seraient soumis à `authenticated()`.

### 7.4 Endpoints techniques publics

- **Actuator :** `/actuator/health`, `/actuator/info` — publics.
- **Swagger / OpenAPI :** `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` — publics. En production, il est courant de les restreindre ou de les désactiver.
- **Auth :** `/api/auth/**` (login, register) — publics par conception.
- **Lecture catalogue :** `GET /api/items/**`, `GET /api/categories` — publics.

Aucune autre route n’est publique ; tout le reste exige un JWT valide, puis éventuellement un rôle (SELLER ou ADMIN) selon le contrôleur.

---

*Document généré pour l’audit de sécurité V1 – état des lieux uniquement, sans proposition de correction.*
