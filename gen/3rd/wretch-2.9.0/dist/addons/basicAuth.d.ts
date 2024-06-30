export default basicAuth;
declare namespace basicAuth {
    function beforeRequest(wretch: any): any;
    namespace wretch {
        function basicAuth(username: any, password: any): any;
    }
}
//# sourceMappingURL=basicAuth.d.ts.map