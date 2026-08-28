note = {
    "quick_apply_certificate": """ 
    Args: 
        body: A JSON structure
             CommonName ( String ): 否   
             Csr ( String ): 否   
             KeyAlg ( String ): 否   
             OrganizationId ( String ): 是   
             Plan ( String ): 是   
             PrivateKey ( String ): 否   
             ProjectName ( String ): 否   
             San ( Array of String ): 否   
             Tag ( String ): 否   
             Tags ( Array of Tag ): 否   
             ValidationType ( String ): 否   
            "字段"： Tag
             Key ( String ): 否  标签键 
             Value ( String ): 否  标签值 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        InstanceId ( String ):  
    """,
    "certificate_get_instance": """ 
    Args: 
        body: A JSON structure
             InstanceId ( String ): 否  实例ID 
             ProjectName ( String ): 否  项目组 
             WithDeployInfo ( Boolean ): 否  是否返回部署详细信息 - 非公开参数 
             WithLogs ( Boolean ): 否  是否返回日志 - 非公开参数 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        San ( Array of String ):  
        Tag ( String ):  
        Logs ( Array of GetInstanceLog ):  
        Tags ( Array of Tag ):  
        Status ( String ):  
        NotAfter ( String ):  
        SourceId ( String ):  
        AccountId ( String ):  
        NotBefore ( String ):  
        OrderPlan ( String ):  
        CommonName ( String ):  
        InstanceId ( String ):  
        OrderBrand ( String ):  
        CreatedTime ( String ):  
        OrderPeriod ( Integer ):  
        ProjectName ( String ):  
        InstanceType ( String ):  
        InstanceLevel ( String ):  
        DeploymentInfo ( Array of GetInstanceDeployInfo ):  
        OwnerAccountId ( String ):  
        IsCertificateSm ( Boolean ):  
        CertificateDetail ( Object of GetInstanceCertificateDetail ):  
        OrderOrganizationId ( String ):  
        RecipientAccountIds ( Array of String ):  
        IsCertificateRevoked ( Boolean ):  
        CertificateDomainType ( String ):  
        EncryptionCertificateDetail ( Object of GetInstanceCertificateDetail ):  
       "字段"： GetInstanceLog
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Time ( String ):  
        Title ( String ):  
        Content ( String ):  
       "字段"： Tag
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Key ( String ):  
        Value ( String ):  
       "字段"： GetInstanceDeployInfo
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Service ( String ):  
        BindingDomains ( Array of String ):  
        BindingResources ( Array of String ):  
       "字段"： GetInstanceCertificateDetail
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Chain ( Array of String ):  
        Issuer ( Object of Subject ):  
        Subject ( Object of Subject ):  
        PrivateKey ( String ):  
        KeyAlgorithm ( String ):  
        SerialNumber ( String ):  
        FingerPrintSha1 ( String ):  
        FingerPrintSha256 ( String ):  
        SignatureAlgorithm ( String ):  
       "字段"： Subject
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Address ( String ):  
        Country ( String ):  
        Locality ( String ):  
        Province ( String ):  
        CommonName ( String ):  
        PostalCode ( String ):  
        Organization ( String ):  
        OrganizationUnit ( String ):  
    """,
    "import_certificate": """ 
    Args: 
        body: A JSON structure
             CertificateInfo ( Object of ImportCertificateRequestCert ): 否  国际证书内容 
             GmCertificateInfo ( Object of ImportCertificateRequestGmCert ): 否  国密证书内容 
             NoVerifyAndFixChain ( Boolean ): 否  是否允许自定义证书链 
             ProjectName ( String ): 否  证书项目组 
             Repeatable ( Boolean ): 否  是否允许重复上传 
             Tag ( String ): 否  证书标签 
             Tags ( Array of Tag ): 否  标签键值对 
            "字段"： ImportCertificateRequestCert
             PrivateKey ( String ): 否  私钥 
             CertificateChain ( String ): 否  证书链 
            "字段"： ImportCertificateRequestGmCert
             SignPrivateKey ( String ): 否  签名证书私钥 
             EncryptPrivateKey ( String ): 否  加密证书私钥 
             SignCertificateChain ( String ): 否  签名证书链 
             EncryptCertificateChain ( String ): 否  加密证书链 
            "字段"： Tag
             Key ( String ): 否  标签键 
             Value ( String ): 否  标签值 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        RepeatId ( String ):  
        InstanceId ( String ):  
    """,
    "certificate_get_instance_list": """ 
    Args: 
        body: A JSON structure
             CertificateExpireAfter ( String ): 否  到期时间区间左端点 
             CertificateExpireBefore ( String ): 否  到期时间区间右端点 
             CommonName ( String ): 否  证书 common name 
             Domain ( String ): 否  证书保护域名 
             InstanceIds ( Array of String ): 否  实例ID 列表 
             InstanceType ( String ): 否  证书类型, 枚举类型: Free/Test/Paid/Imported 
             IsRevoked ( Boolean ): 否  是否吊销 
             IsValid ( Boolean ): 否  是否可用（未吊销、未过期） 
             PageNumber ( Integer ): 否  页面号 
             PageSize ( Integer ): 否  页面大小 
             ProjectName ( String ): 否  项目组 
             ShareableOnly ( Boolean ): 否  是否只返回可以被share的资源 
             Status ( Array of String ): 否  实例状态, 枚举类型: NotSubmitted/Pending/Issued/Cancelling/Canceled/Revoking/Revoked/Failed/Unknown 
             Tag ( String ): 否  证书标签 
             TagFilters ( Array of TagFilter ): 否  标签筛选器 
             WithDeploySummary ( Boolean ): 否  是否携带部署信息汇总 - 非公开参数 
             WithExpireNotice ( Boolean ): 否  是否携带过期提醒状态 - 非公开参数 
             WithRenewable ( Boolean ): 否  是否携带可续费信息 - 非公开参数 
             WithoutMultiYear ( Boolean ): 否  是否携带多年期证书的子证书 - 非公开参数 
            "字段"： TagFilter
             Key ( String ): 否  标签键 
             Values ( Array of String ): 否  标签值，为或关系 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        PageSize ( Integer ):  
        Instances ( Array of ListInstanceResponseInstance ):  
        PageNumber ( Integer ):  
        TotalCount ( Integer ):  
       "字段"： ListInstanceResponseInstance
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        San ( Array of String ):  
        Tag ( String ):  
        Tags ( Array of Tag ):  
        Issuer ( String ):  
        Status ( String ):  
        NotAfter ( String ):  
        SourceId ( String ):  
        AccountId ( String ):  
        NotBefore ( String ):  
        CommonName ( String ):  
        DeployInfo ( Object of ListRespDeployInfo ):  
        InstanceId ( String ):  
        OrderBrand ( String ):  
        CreatedTime ( String ):  
        OrderPeriod ( Integer ):  
        ProjectName ( String ):  
        RenewedInfo ( Object of RenewedInfo ):  
        InstanceType ( String ):  
        InstanceLevel ( String ):  
        OwnerAccountId ( String ):  
        IsCertificateSm ( Boolean ):  
        ExpireNoticeStatus ( String ):  
        RecipientAccountIds ( Array of String ):  
        IsCertificateRevoked ( Boolean ):  
        CertificateDomainType ( String ):  
        CertificateKeyAlgorithm ( String ):  
       "字段"： Tag
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Key ( String ):  
        Value ( String ):  
       "字段"： ListRespDeployInfo
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Deployable ( Boolean ):  
        DeploySummary ( Array of DeploySummary ):  
       "字段"： RenewedInfo
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        PostInstanceId ( String ):  
        RenewalEligibility ( String ):  
       "字段"： DeploySummary
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        ServiceName ( String ):  
        ResourceCount ( Integer ):  
    """,
    "certificate_add_organization": """ 
    Args: 
        body: A JSON structure
             Address ( String ): 否  企业地址 - 企业模版必填 
             BusinessLicenseNo ( String ): 否  企业统一社会信用码 
             City ( String ): 否  企业城市 - 企业模版必填 
             Contact ( Object of Contact ): 否  企业联系人 - 必填 
             Country ( String ): 否  企业国家 - 企业模版必填 
             Department ( String ): 否  企业部门 
             Email ( String ): 否  企业邮箱 
             Name ( String ): 否  企业名称 - 企业模版必填 
             PostalCode ( String ): 否  企业邮编 
             ProjectName ( String ): 否  项目组名称 
             Province ( String ): 否  企业省份 - 企业模版必填 
             Tag ( String ): 否  模版名称 - 必填 
             Tags ( Array of Tag ): 否  标签 
             Type ( String ): 否  模版类型 - 必填 
            "字段"： Contact
             Email ( String ): 否   
             Phone ( String ): 否   
             IdCardNo ( String ): 否   
             LastName ( String ): 否   
             FirstName ( String ): 否   
            "字段"： Tag
             Key ( String ): 否  标签键 
             Value ( String ): 否  标签值 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        OrganizationId ( String ):  
    """,
    "certificate_get_organization": """ 
    Args: 
        body: A JSON structure
             OrganizationId ( String ): 否  模版 ID 
             ProjectName ( String ): 否  项目组名称 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Tag ( String ):  
        City ( String ):  
        Name ( String ):  
        Tags ( Array of Tag ):  
        Type ( String ):  
        Email ( String ):  
        Account ( String ):  
        Address ( String ):  
        Contact ( Object of Contact ):  
        Country ( String ):  
        Province ( String ):  
        Department ( String ):  
        PostalCode ( String ):  
        CreatedTime ( String ):  
        ProjectName ( String ):  
        OrganizationId ( String ):  
        BusinessLicenseNo ( String ):  
       "字段"： Tag
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Key ( String ):  
        Value ( String ):  
       "字段"： Contact
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Email ( String ):  
        Phone ( String ):  
        IdCardNo ( String ):  
        LastName ( String ):  
        FirstName ( String ):  
    """,
    "certificate_get_organization_list": """ 
    Args: 
        body: A JSON structure
             OrganizationIds ( Array of String ): 否  模版ID 
             OrganizationType ( String ): 否  模版类型 
             PageNumber ( Integer ): 否  页面号 
             PageSize ( Integer ): 否  页面大小 
             ProjectName ( String ): 否  项目组名称 
             Tag ( String ): 否  模版名称 
             TagFilters ( Array of TagFilter ): 否  标签筛选器 
            "字段"： TagFilter
             Key ( String ): 否  标签键 
             Values ( Array of String ): 否  标签值，为或关系 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        PageSize ( Integer ):  
        PageNumber ( Integer ):  
        TotalCount ( Integer ):  
        Organizations ( Array of GetOrganizationResponseV2 ):  
       "字段"： GetOrganizationResponseV2
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Tag ( String ):  
        City ( String ):  
        Name ( String ):  
        Tags ( Array of Tag ):  
        Type ( String ):  
        Email ( String ):  
        Account ( String ):  
        Address ( String ):  
        Contact ( Object of Contact ):  
        Country ( String ):  
        Province ( String ):  
        Department ( String ):  
        PostalCode ( String ):  
        CreatedTime ( String ):  
        ProjectName ( String ):  
        OrganizationId ( String ):  
        BusinessLicenseNo ( String ):  
       "字段"： Tag
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Key ( String ):  
        Value ( String ):  
       "字段"： Contact
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        Email ( String ):  
        Phone ( String ):  
        IdCardNo ( String ):  
        LastName ( String ):  
        FirstName ( String ):  
    """,
    "list_tags_for_resources": """ 
    Args: 
        body: A JSON structure
             PageNumber ( Integer ): 否  页码，选填 
             PageSize ( Integer ): 否  每页数量，选填 
             ResourceIds ( Array of String ): 否  资源 ID 列表，最长50，选填 
             ResourceType ( String ): 否  资源类型,必填 
             TagFilters ( Array of TagFilter ): 否  标签过滤器，选填 
            "字段"： TagFilter
             Key ( String ): 否  标签键 
             Values ( Array of String ): 否  标签值，为或关系 
   Returns: 
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        PageSize ( Integer ):  
        PageNumber ( Integer ):  
        TotalCount ( Integer ):  
        ResourceTags ( Array of ListResourceTag ):  
       "字段"： ListResourceTag
        参数 ( 类型 ): 示例值 
        ---- ( ---- ): ---- 
        TagKey ( String ):  
        TagValue ( String ):  
        ResourceId ( String ):  
        ResourceType ( String ):  
    """,
}
